#!/usr/bin/env python3
"""
ARGO Data Pipeline CLI Wrapper
Command-line interface for the ARGO data processing pipeline
"""

import sys
import json
import argparse
import asyncio
from argo_data_pipeline import ARGODataProcessor, query_argo_data, semantic_search_profiles

async def main():
    parser = argparse.ArgumentParser(description='ARGO Data Processing Pipeline')
    parser.add_argument('--query', type=str, help='Query processed ARGO data (JSON format)')
    parser.add_argument('--semantic-search', type=str, help='Semantic search query (JSON format)')
    parser.add_argument('--process-directory', type=str, help='Directory path to process NetCDF files')
    parser.add_argument('--stats', action='store_true', help='Get database statistics')
    
    args = parser.parse_args()
    
    try:
        if args.query:
            # Parse query parameters
            query_params = json.loads(args.query)
            result = await query_argo_data(
                region=query_params.get('region'),
                start_date=query_params.get('start_date'),
                end_date=query_params.get('end_date'),
                temperature_range=query_params.get('temperature_range'),
                salinity_range=query_params.get('salinity_range')
            )
            print(json.dumps(result))
            
        elif args.semantic_search:
            # Parse semantic search parameters
            search_params = json.loads(args.semantic_search)
            result = await semantic_search_profiles(
                query=search_params.get('query', ''),
                top_k=search_params.get('top_k', 5)
            )
            print(json.dumps(result))
            
        elif args.process_directory:
            # Process directory
            processor = ARGODataProcessor()
            await processor.process_directory(args.process_directory)
            print(json.dumps({'success': True, 'message': f'Processed directory: {args.process_directory}'}))
            
        elif args.stats:
            # Get database statistics
            processor = ARGODataProcessor()
            await processor.initialize_database()
            
            session = processor.Session()
            try:
                from sqlalchemy import text
                
                # Get table counts
                float_count = session.execute(text("SELECT COUNT(*) FROM argo_floats")).scalar()
                profile_count = session.execute(text("SELECT COUNT(*) FROM argo_profiles")).scalar()
                
                # Get date range
                date_range = session.execute(text("""
                    SELECT MIN(measurement_time) as min_date, MAX(measurement_time) as max_date 
                    FROM argo_floats
                """)).fetchone()
                
                # Get region distribution
                region_stats = session.execute(text("""
                    SELECT ocean_region, COUNT(*) as count 
                    FROM argo_floats 
                    GROUP BY ocean_region 
                    ORDER BY count DESC
                """)).fetchall()
                
                stats = {
                    'success': True,
                    'total_measurements': float_count,
                    'total_profiles': profile_count,
                    'date_range': {
                        'start': date_range[0].isoformat() if date_range[0] else None,
                        'end': date_range[1].isoformat() if date_range[1] else None
                    },
                    'region_distribution': [{'region': r[0], 'count': r[1]} for r in region_stats]
                }
                
                print(json.dumps(stats))
                
            finally:
                session.close()
        
        else:
            print(json.dumps({'error': 'No valid command provided'}))
            
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == "__main__":
    asyncio.run(main())