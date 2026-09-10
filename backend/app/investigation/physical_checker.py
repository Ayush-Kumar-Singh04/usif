def check_physical(sensor_type: str | None, value: float | None) -> str:
    """
    Checks if the telemetry value lies within physically realistic bounds for the sensor type.
    Returns "PASS" or "FAIL".
    """
    if value is None or not sensor_type:
        return "FAIL"
    
    st_lower = sensor_type.lower()
    
    if "temp" in st_lower:
        # Temperature: -40°C to 85°C
        if -40.0 <= value <= 85.0:
            return "PASS"
        return "FAIL"
        
    elif "humid" in st_lower:
        # Humidity: 0% to 100%
        if 0.0 <= value <= 100.0:
            return "PASS"
        return "FAIL"
        
    elif "press" in st_lower:
        # Pressure: 300 hPa to 1100 hPa
        if 300.0 <= value <= 1100.0:
            return "PASS"
        return "FAIL"
        
    elif "vib" in st_lower:
        # Vibration: 0 to 500 units (must be positive)
        if 0.0 <= value <= 500.0:
            return "PASS"
        return "FAIL"
        
    else:
        # Generic fallback
        if -1000.0 <= value <= 1000.0:
            return "PASS"
        return "FAIL"
