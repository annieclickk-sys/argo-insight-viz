#!/usr/bin/env python3
"""
ARGO NetCDF Data Processing Pipeline
Processes ARGO float NetCDF files and stores data in PostgreSQL and vector database
"""

import os
import sys
import asyncio
import logging
import numpy as np
import pandas as pd
import xarray as xr
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import json
import hashlib

# Database imports
import psycopg2
from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, Float, String, DateTime, JSON, Index
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

# Vector processing imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

Base = declarative_base()

class ARGOFloat(Base):
    """SQLAlchemy model for ARGO float data"""
    __tablename__ = 'argo_floats'
    
    id = Column(String, primary_key=True)
    platform_number = Column(String, index=True)
    cycle_number = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    measurement_time = Column(DateTime(timezone=True), index=True)
    temperature = Column(Float)
    salinity = Column(Float)
    pressure = Column(Float)
    depth = Column(Float)
    quality_flag = Column(String)
    ocean_region = Column(String, index=True)
    data_source = Column(String)
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

class ARGOProfile(Base):
    """SQLAlchemy model for ARGO profile summaries"""
    __tablename__ = 'argo_profiles'
    
    id = Column(String, primary_key=True)
    platform_number = Column(String, index=True)
    cycle_number = Column(Integer)
    profile_date = Column(DateTime(timezone=True), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    max_depth = Column(Float)
    num_measurements = Column(Integer)
    temperature_range = Column(JSON)  # {"min": x, "max": y, "mean": z}
    salinity_range = Column(JSON)
    pressure_range = Column(JSON)
    ocean_region = Column(String, index=True)
    data_quality_score = Column(Float)
    summary_text = Column(String)  # For vector search
    vector_embedding = Column(String)  # Serialized vector representation
    file_source = Column(String)
    processing_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))

class ARGODataProcessor:
    """Main class for processing ARGO NetCDF data"""
    
    def __init__(self, db_connection_string: Optional[str] = None):
        """Initialize the data processor"""
        self.db_connection_string = db_connection_string or self._get_db_connection_string()
        self.engine = None
        self.Session = None
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.vector_store = {}  # Simple in-memory vector store
        
    def _get_db_connection_string(self) -> str:
        """Get database connection string from environment variables"""
        # Check for Replit database environment variables
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            return database_url
        
        # Fallback to individual components
        host = os.getenv('PGHOST', 'localhost')
        port = os.getenv('PGPORT', '5432')
        database = os.getenv('PGDATABASE', 'argo_data')
        user = os.getenv('PGUSER', 'postgres')
        password = os.getenv('PGPASSWORD', '')
        
        return f"postgresql://{user}:{password}@{host}:{port}/{database}"
    
    async def initialize_database(self):
        """Initialize database connection and create tables"""
        try:
            self.engine = create_engine(self.db_connection_string, echo=False)
            self.Session = sessionmaker(bind=self.engine)
            
            # Create tables
            Base.metadata.create_all(self.engine)
            
            # Create additional indexes
            with self.engine.connect() as conn:
                # Spatial index for lat/lon queries
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_argo_floats_location 
                    ON argo_floats (latitude, longitude);
                """))
                
                # Time-based index
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_argo_floats_time_location 
                    ON argo_floats (measurement_time, latitude, longitude);
                """))
                
                # Profile summary index
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_argo_profiles_location_date 
                    ON argo_profiles (latitude, longitude, profile_date);
                """))
                
                conn.commit()
            
            logger.info("Database initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            return False
    
    def determine_ocean_region(self, lat: float, lon: float) -> str:
        """Determine ocean region based on coordinates"""
        # Simple region classification
        if -180 <= lon <= -60 and 10 <= lat <= 70:
            return "North Atlantic"
        elif 60 <= lon <= 180 and 10 <= lat <= 70:
            return "North Pacific"
        elif -60 <= lon <= 20 and -60 <= lat <= 10:
            return "South Atlantic"
        elif 20 <= lon <= 180 and -60 <= lat <= 10:
            return "South Pacific"
        elif 20 <= lon <= 120 and -40 <= lat <= 30:
            return "Indian Ocean"
        elif lat > 70:
            return "Arctic Ocean"
        elif lat < -60:
            return "Southern Ocean"
        else:
            return "Unknown"
    
    def process_netcdf_file(self, file_path: str) -> Tuple[List[Dict], Dict]:
        """Process a single NetCDF file and extract ARGO data"""
        try:
            logger.info(f"Processing NetCDF file: {file_path}")
            
            # Open NetCDF file with xarray
            ds = xr.open_dataset(file_path)
            
            float_data = []
            profile_data = {}
            
            # Extract basic metadata
            platform_number = str(ds.attrs.get('platform_number', 'unknown'))
            
            # Process each profile in the file
            for cycle_idx in range(len(ds.N_PROF.values)):
                cycle_number = int(ds.CYCLE_NUMBER.values[cycle_idx])
                
                # Get profile location and time
                profile_lat = float(ds.LATITUDE.values[cycle_idx])
                profile_lon = float(ds.LONGITUDE.values[cycle_idx])
                
                # Handle time conversion
                try:
                    profile_time = pd.to_datetime(ds.JULD.values[cycle_idx], 
                                                origin='1950-01-01', unit='D')
                    if pd.isna(profile_time):
                        profile_time = datetime.now(timezone.utc)
                    else:
                        profile_time = profile_time.tz_localize('UTC')
                except:
                    profile_time = datetime.now(timezone.utc)
                
                ocean_region = self.determine_ocean_region(profile_lat, profile_lon)
                
                # Extract measurements for this profile
                temps = ds.TEMP.values[cycle_idx, :]
                sals = ds.PSAL.values[cycle_idx, :]
                pres = ds.PRES.values[cycle_idx, :]
                
                # Filter valid measurements
                valid_measurements = []
                temp_list = []
                sal_list = []
                pres_list = []
                
                for level_idx in range(len(temps)):
                    temp = temps[level_idx]
                    sal = sals[level_idx]
                    pressure = pres[level_idx]
                    
                    # Check for valid data (not NaN)
                    if not (np.isnan(temp) or np.isnan(sal) or np.isnan(pressure)):
                        depth = self.pressure_to_depth(pressure)
                        
                        measurement_id = f"{platform_number}_{cycle_number}_{level_idx}"
                        
                        measurement = {
                            'id': measurement_id,
                            'platform_number': platform_number,
                            'cycle_number': cycle_number,
                            'latitude': profile_lat,
                            'longitude': profile_lon,
                            'measurement_time': profile_time,
                            'temperature': float(temp),
                            'salinity': float(sal),
                            'pressure': float(pressure),
                            'depth': depth,
                            'quality_flag': 'good',
                            'ocean_region': ocean_region,
                            'data_source': file_path,
                            'metadata': {
                                'level_index': level_idx,
                                'file_source': file_path
                            }
                        }
                        
                        valid_measurements.append(measurement)
                        temp_list.append(float(temp))
                        sal_list.append(float(sal))
                        pres_list.append(float(pressure))
                
                float_data.extend(valid_measurements)
                
                # Create profile summary
                if valid_measurements:
                    profile_id = f"{platform_number}_{cycle_number}"
                    
                    summary_text = (f"ARGO float {platform_number} profile {cycle_number} "
                                  f"at {profile_lat:.2f}°N {profile_lon:.2f}°E in {ocean_region} "
                                  f"with {len(valid_measurements)} measurements. "
                                  f"Temperature range: {min(temp_list):.2f}-{max(temp_list):.2f}°C, "
                                  f"Salinity range: {min(sal_list):.2f}-{max(sal_list):.2f} PSU, "
                                  f"Depth range: 0-{max([m['depth'] for m in valid_measurements]):.0f}m")
                    
                    profile_data = {
                        'id': profile_id,
                        'platform_number': platform_number,
                        'cycle_number': cycle_number,
                        'profile_date': profile_time,
                        'latitude': profile_lat,
                        'longitude': profile_lon,
                        'max_depth': max([m['depth'] for m in valid_measurements]),
                        'num_measurements': len(valid_measurements),
                        'temperature_range': {
                            'min': min(temp_list),
                            'max': max(temp_list),
                            'mean': np.mean(temp_list)
                        },
                        'salinity_range': {
                            'min': min(sal_list),
                            'max': max(sal_list),
                            'mean': np.mean(sal_list)
                        },
                        'pressure_range': {
                            'min': min(pres_list),
                            'max': max(pres_list),
                            'mean': np.mean(pres_list)
                        },
                        'ocean_region': ocean_region,
                        'data_quality_score': len(valid_measurements) / len(temps),
                        'summary_text': summary_text,
                        'file_source': file_path,
                        'processing_metadata': {
                            'processed_at': datetime.now(timezone.utc).isoformat(),
                            'total_levels': len(temps),
                            'valid_levels': len(valid_measurements)
                        }
                    }
            
            ds.close()
            logger.info(f"Extracted {len(float_data)} measurements and {1 if profile_data else 0} profiles")
            return float_data, profile_data
            
        except Exception as e:
            logger.error(f"Error processing NetCDF file {file_path}: {e}")
            return [], {}
    
    def pressure_to_depth(self, pressure: float) -> float:
        """Convert pressure (dbar) to depth (meters) using simple approximation"""
        # Simple approximation: 1 dbar ≈ 1 meter depth
        return pressure * 1.019716  # More accurate conversion factor
    
    async def store_to_postgresql(self, float_data: List[Dict], profile_data: Dict):
        """Store processed data to PostgreSQL"""
        if not self.engine:
            await self.initialize_database()
        
        if not self.Session:
            raise RuntimeError("Database not initialized. Call initialize_database first.")
        session = self.Session()
        try:
            # Store float measurements
            for measurement in float_data:
                float_obj = ARGOFloat(**measurement)
                session.merge(float_obj)  # Use merge to handle duplicates
            
            # Store profile summary
            if profile_data:
                profile_obj = ARGOProfile(**profile_data)
                session.merge(profile_obj)
            
            session.commit()
            logger.info(f"Stored {len(float_data)} measurements and {'1' if profile_data else '0'} profiles to PostgreSQL")
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error storing data to PostgreSQL: {e}")
            raise
        finally:
            session.close()
    
    def create_vector_embedding(self, text: str) -> np.ndarray:
        """Create vector embedding from text using TF-IDF"""
        try:
            # Fit vectorizer if not already done
            if not hasattr(self.vectorizer, 'vocabulary_'):
                # Use some sample text to fit the vectorizer
                sample_texts = [text]
                self.vectorizer.fit(sample_texts)
            
            # Transform text to vector
            transformed = self.vectorizer.transform([text])
            if hasattr(transformed, 'toarray'):
                vector = transformed.toarray()[0]
            else:
                vector = np.array(transformed)[0]
            return vector
        except Exception as e:
            logger.warning(f"Error creating vector embedding: {e}")
            # Return zero vector as fallback
            return np.zeros(1000)
    
    async def store_to_vector_database(self, profile_data: Dict):
        """Store profile data to vector database (simple FAISS-like implementation)"""
        if not profile_data:
            return
        
        try:
            # Create vector embedding from summary text
            summary_text = profile_data.get('summary_text', '')
            vector = self.create_vector_embedding(summary_text)
            
            # Store in simple vector store
            profile_id = profile_data['id']
            self.vector_store[profile_id] = {
                'vector': vector.tolist(),
                'metadata': {
                    'platform_number': profile_data['platform_number'],
                    'ocean_region': profile_data['ocean_region'],
                    'latitude': profile_data['latitude'],
                    'longitude': profile_data['longitude'],
                    'profile_date': profile_data['profile_date'].isoformat(),
                    'temperature_range': profile_data['temperature_range'],
                    'salinity_range': profile_data['salinity_range']
                },
                'text': summary_text
            }
            
            # Update PostgreSQL with vector embedding
            vector_str = json.dumps(vector.tolist())
            profile_data['vector_embedding'] = vector_str
            
            logger.info(f"Created vector embedding for profile {profile_id}")
            
        except Exception as e:
            logger.error(f"Error creating vector embedding: {e}")
    
    def search_similar_profiles(self, query_text: str, top_k: int = 5) -> List[Dict]:
        """Search for similar profiles using vector similarity"""
        try:
            if not self.vector_store:
                return []
            
            # Create query vector
            query_vector = self.create_vector_embedding(query_text)
            
            # Calculate similarities
            similarities = []
            for profile_id, data in self.vector_store.items():
                stored_vector = np.array(data['vector'])
                similarity = cosine_similarity([query_vector], [stored_vector])[0][0]
                similarities.append({
                    'profile_id': profile_id,
                    'similarity': similarity,
                    'metadata': data['metadata'],
                    'text': data['text']
                })
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Error searching similar profiles: {e}")
            return []
    
    async def process_directory(self, directory_path: str):
        """Process all NetCDF files in a directory"""
        directory = Path(directory_path)
        if not directory.exists():
            logger.error(f"Directory {directory_path} does not exist")
            return
        
        # Find all NetCDF files
        nc_files = list(directory.glob("*.nc"))
        logger.info(f"Found {len(nc_files)} NetCDF files to process")
        
        for nc_file in nc_files:
            try:
                # Process file
                float_data, profile_data = self.process_netcdf_file(str(nc_file))
                
                if float_data:
                    # Store to PostgreSQL
                    await self.store_to_postgresql(float_data, profile_data)
                    
                    # Store to vector database
                    if profile_data:
                        await self.store_to_vector_database(profile_data)
                        
                logger.info(f"Successfully processed {nc_file.name}")
                
            except Exception as e:
                logger.error(f"Failed to process {nc_file.name}: {e}")
                continue
    
    def save_vector_store(self, file_path: str = "argo_vector_store.pkl"):
        """Save vector store to file"""
        try:
            with open(file_path, 'wb') as f:
                pickle.dump({
                    'vector_store': self.vector_store,
                    'vectorizer': self.vectorizer
                }, f)
            logger.info(f"Vector store saved to {file_path}")
        except Exception as e:
            logger.error(f"Error saving vector store: {e}")
    
    def load_vector_store(self, file_path: str = "argo_vector_store.pkl"):
        """Load vector store from file"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    data = pickle.load(f)
                    self.vector_store = data['vector_store']
                    self.vectorizer = data['vectorizer']
                logger.info(f"Vector store loaded from {file_path}")
                return True
        except Exception as e:
            logger.error(f"Error loading vector store: {e}")
        return False

# API Integration Functions
async def query_argo_data(region: str, start_date: str, end_date: str, 
                         temperature_range: Optional[Tuple[float, float]] = None,
                         salinity_range: Optional[Tuple[float, float]] = None) -> Dict:
    """Query ARGO data from PostgreSQL with filters"""
    processor = ARGODataProcessor()
    await processor.initialize_database()
    
    if not processor.Session:
        raise RuntimeError("Database not initialized")
    session = processor.Session()
    try:
        query = session.query(ARGOFloat)
        
        # Apply filters
        if region and region != 'Unknown':
            query = query.filter(ARGOFloat.ocean_region == region)
        
        if start_date:
            query = query.filter(ARGOFloat.measurement_time >= start_date)
        
        if end_date:
            query = query.filter(ARGOFloat.measurement_time <= end_date)
        
        if temperature_range:
            query = query.filter(
                ARGOFloat.temperature >= temperature_range[0],
                ARGOFloat.temperature <= temperature_range[1]
            )
        
        if salinity_range:
            query = query.filter(
                ARGOFloat.salinity >= salinity_range[0],
                ARGOFloat.salinity <= salinity_range[1]
            )
        
        results = query.limit(1000).all()  # Limit for performance
        
        # Convert to dictionary format
        data = []
        for result in results:
            data.append({
                'time': result.measurement_time.isoformat(),
                'latitude': result.latitude,
                'longitude': result.longitude,
                'temperature': result.temperature,
                'salinity': result.salinity,
                'depth': result.depth,
                'platform_number': result.platform_number,
                'ocean_region': result.ocean_region
            })
        
        return {
            'success': True,
            'count': len(data),
            'data': data
        }
        
    except Exception as e:
        logger.error(f"Error querying ARGO data: {e}")
        return {'success': False, 'error': str(e)}
    finally:
        session.close()

async def semantic_search_profiles(query: str, top_k: int = 5) -> Dict:
    """Perform semantic search on ARGO profiles"""
    processor = ARGODataProcessor()
    processor.load_vector_store()
    
    try:
        results = processor.search_similar_profiles(query, top_k)
        return {
            'success': True,
            'query': query,
            'results': results
        }
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    async def main():
        processor = ARGODataProcessor()
        
        # Initialize database
        if not await processor.initialize_database():
            logger.error("Failed to initialize database")
            return
        
        # Process sample data or directory
        if len(sys.argv) > 1:
            directory_path = sys.argv[1]
            await processor.process_directory(directory_path)
        else:
            logger.info("ARGO Data Pipeline initialized. Use process_directory() to process NetCDF files.")
        
        # Save vector store
        processor.save_vector_store()
    
    asyncio.run(main())