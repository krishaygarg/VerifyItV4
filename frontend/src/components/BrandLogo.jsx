import React from 'react';

export default function BrandLogo({ size = 'medium' }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isLarge ? '12px' : isSmall ? '6px' : '8px',
    margin: isLarge ? '0 0 2rem 0' : '0'
  };

  const checkboxStyle = {
    height: isLarge ? '3.5rem' : isSmall ? '1.8rem' : '2.5rem',
    width: isLarge ? '4.5rem' : isSmall ? '2.2rem' : '3.2rem',
    backgroundColor: '#ff3b3b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: isLarge ? '8px' : '4px',
    boxShadow: '0 4px 10px rgba(255, 59, 59, 0.3)',
    flexShrink: 0
  };

  const checkMarkStyle = {
    width: '65%',
    height: '65%',
    fill: 'none',
    stroke: '#ffffff',
    strokeWidth: '4',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  const textStyle = {
    fontFamily: 'Quicksand, arial, sans-serif',
    fontWeight: 'bold',
    fontSize: isLarge ? '3rem' : isSmall ? '1.5rem' : '2.2rem',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div style={containerStyle}>
      <div style={checkboxStyle}>
        <svg viewBox="0 0 24 24" style={checkMarkStyle}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span style={textStyle}>
        <span style={{ color: '#ffffff', marginRight: '6px' }}>VERIFY</span>
        <span style={{ color: '#ff3b3b' }}>IT!</span>
        <span style={{ color: '#ffffff', fontSize: '0.4em', alignSelf: 'flex-start', marginTop: isLarge ? '12px' : '6px' }}>&trade;</span>
      </span>
    </div>
  );
}
