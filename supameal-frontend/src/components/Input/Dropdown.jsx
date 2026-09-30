import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Dropdown.css';

const Dropdown = ({ options, value, onChange, placeholder = "Select option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div 
        className="dropdown-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={16} className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="dropdown-list">
          {options.map((option, index) => (
            <div 
              key={index} 
              className={`dropdown-item ${value === option ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
