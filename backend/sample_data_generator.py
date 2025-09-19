#!/usr/bin/env python3
"""
Sample ARGO NetCDF Data Generator
Creates sample NetCDF files for testing the ARGO data pipeline
"""

import numpy as np
import xarray as xr
from datetime import datetime, timedelta
import pandas as pd
import os
from pathlib import Path

def generate_sample_argo_netcdf(platform_number: str, num_cycles: int = 5, output_dir: str = "sample_argo_data"):
    """Generate a sample ARGO NetCDF file for testing"""
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    # Generate realistic ARGO data
    n_prof = num_cycles  # Number of profiles
    n_levels = 50  # Number of depth levels per profile
    
    # Time data (profiles every 10 days)
    base_time = datetime(2024, 1, 1)
    times = [base_time + timedelta(days=10*i) for i in range(n_prof)]
    
    # Convert to Julian days since 1950-01-01 (ARGO standard)
    juld = np.array([(t - datetime(1950, 1, 1)).total_seconds() / 86400.0 for t in times])
    
    # Geographic coordinates (simulate float drift)
    base_lat = -30.0 + np.random.random() * 20  # Southern Ocean region
    base_lon = 150.0 + np.random.random() * 30  # Pacific region
    
    latitudes = []
    longitudes = []
    
    for i in range(n_prof):
        # Simulate gradual drift
        lat_drift = np.random.normal(0, 0.1) * i
        lon_drift = np.random.normal(0, 0.1) * i
        latitudes.append(base_lat + lat_drift)
        longitudes.append(base_lon + lon_drift)
    
    # Pressure levels (standard ARGO depths)
    pressure_levels = np.array([
        5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
        125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500,
        600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500,
        1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 
        2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400
    ])
    
    # Initialize data arrays
    temp_data = np.full((n_prof, n_levels), np.nan)
    sal_data = np.full((n_prof, n_levels), np.nan)
    pres_data = np.full((n_prof, n_levels), np.nan)
    
    # Generate realistic T/S profiles
    for prof_idx in range(n_prof):
        # Surface temperature varies with season and location
        surface_temp = 20 + 5 * np.sin(2 * np.pi * prof_idx / 12) + np.random.normal(0, 1)
        
        # Temperature decreases with depth
        for level_idx in range(n_levels):
            depth = pressure_levels[level_idx]
            pres_data[prof_idx, level_idx] = depth
            
            # Temperature profile (exponential decay with depth)
            temp_data[prof_idx, level_idx] = (surface_temp * np.exp(-depth / 500) + 
                                            2 + np.random.normal(0, 0.5))
            
            # Salinity profile (increases with depth, then stabilizes)
            if depth < 200:
                sal_data[prof_idx, level_idx] = 34.0 + depth * 0.005 + np.random.normal(0, 0.1)
            else:
                sal_data[prof_idx, level_idx] = 35.0 + np.random.normal(0, 0.1)
    
    # Create xarray Dataset
    ds = xr.Dataset(
        {
            'TEMP': (['N_PROF', 'N_LEVELS'], temp_data),
            'PSAL': (['N_PROF', 'N_LEVELS'], sal_data),
            'PRES': (['N_PROF', 'N_LEVELS'], pres_data),
            'LATITUDE': (['N_PROF'], latitudes),
            'LONGITUDE': (['N_PROF'], longitudes),
            'JULD': (['N_PROF'], juld),
            'CYCLE_NUMBER': (['N_PROF'], list(range(1, n_prof + 1))),
        },
        coords={
            'N_PROF': list(range(n_prof)),
            'N_LEVELS': list(range(n_levels)),
        },
        attrs={
            'title': f'Sample ARGO float data for platform {platform_number}',
            'platform_number': platform_number,
            'data_centre': 'TEST',
            'created_by': 'ARGO Data Pipeline Sample Generator',
            'date_creation': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
    )
    
    # Add variable attributes
    ds.TEMP.attrs = {
        'long_name': 'Sea temperature in-situ ITS-90 scale',
        'units': 'degree_Celsius',
        'standard_name': 'sea_water_temperature',
        '_FillValue': np.nan
    }
    
    ds.PSAL.attrs = {
        'long_name': 'Practical salinity',
        'units': 'psu',
        'standard_name': 'sea_water_practical_salinity',
        '_FillValue': np.nan
    }
    
    ds.PRES.attrs = {
        'long_name': 'Sea water pressure, equals 0 at sea-level',
        'units': 'decibar',
        'standard_name': 'sea_water_pressure',
        '_FillValue': np.nan
    }
    
    ds.LATITUDE.attrs = {
        'long_name': 'Latitude of the station, best estimate',
        'units': 'degree_north',
        'standard_name': 'latitude'
    }
    
    ds.LONGITUDE.attrs = {
        'long_name': 'Longitude of the station, best estimate',
        'units': 'degree_east',
        'standard_name': 'longitude'
    }
    
    ds.JULD.attrs = {
        'long_name': 'Julian day (UTC) of the station relative to REFERENCE_DATE_TIME',
        'units': 'days since 1950-01-01 00:00:00 UTC',
        'standard_name': 'time'
    }
    
    # Save to NetCDF file
    filename = f"{output_dir}/argo_{platform_number}_sample.nc"
    ds.to_netcdf(filename)
    
    print(f"Generated sample ARGO NetCDF file: {filename}")
    print(f"  Platform: {platform_number}")
    print(f"  Profiles: {n_prof}")
    print(f"  Levels per profile: {n_levels}")
    print(f"  Date range: {times[0].strftime('%Y-%m-%d')} to {times[-1].strftime('%Y-%m-%d')}")
    print(f"  Geographic range: {min(latitudes):.2f}°N to {max(latitudes):.2f}°N, {min(longitudes):.2f}°E to {max(longitudes):.2f}°E")
    
    return filename

def generate_multiple_sample_files(num_floats: int = 3, output_dir: str = "sample_argo_data"):
    """Generate multiple sample ARGO files"""
    
    print(f"Generating {num_floats} sample ARGO NetCDF files...")
    
    files_created = []
    for i in range(num_floats):
        platform_number = f"test_{1000 + i}"
        filename = generate_sample_argo_netcdf(platform_number, num_cycles=5 + i, output_dir=output_dir)
        files_created.append(filename)
    
    print(f"\nSample data generation complete!")
    print(f"Files created in: {output_dir}/")
    print("\nTo process these files with the ARGO pipeline:")
    print(f"  python3 argo_cli.py --process-directory {output_dir}")
    
    return files_created

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        num_floats = int(sys.argv[1])
    else:
        num_floats = 3
    
    generate_multiple_sample_files(num_floats)