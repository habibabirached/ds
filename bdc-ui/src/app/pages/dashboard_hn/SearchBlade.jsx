import React, { useState, useEffect } from 'react';
import * as d3 from 'd3-fetch';
import { Select } from 'antd'; 

const { Option } = Select;

function SearchBlade({csvFileUrl}) {
  const [query, setQuery] = useState(''); 
  const [data, setData] = useState([]); 
  const [filteredOptions, setFilteredOptions] = useState([]); 
  const [selectedBlade, setSelectedBlade] = useState(null); 

  // Fetch the CSV data and process it
  useEffect(() => {
    //let url = '/DashboardHnData.csv';
    let url = csvFileUrl;

    d3.csv(url, (d) => {
      const parsedDate = new Date(d['Inspection Date']); 
      return {
        date: parsedDate,
        factory_name: d['Factory Name'],
        location: d['Blade Cavity'],
        inspector: d['sso'],
        bladeType: d['inspection_blade_type'],
        annotationStatus: d['Annotation Status'],
        ManufactureStage: d['Manufacture Stage'],
        humanTolerance: +d['Total_Within_Tolerance (M)'],
        aiTolerance: +d['Total_Within_Tolerance (AI)'],
        humanRepaired: +d['Total_Repaired (M)'],
        aiRepaired: +d['Total_Repaired (AI)'],
        humanOpen: +d['Total_Open (M)'],
        aiOpen: +d['Total_Open (AI)'],
        blade_id: d['Blade ID'],
      };
    })
      .then((csvData) => {
        const validData = csvData.filter(d => !isNaN(d.date)); 
        setData(validData);
        setFilteredOptions(validData.map((blade) => ({ label: blade.blade_id, value: blade.blade_id })));
      })
      .catch((err) => {
        console.error('Error loading CSV:', err);
      });
  }, [csvFileUrl]);

 
  const handleSearch = (value) => {
    setQuery(value); 

 
    const filtered = data.filter((option) =>
      option.blade_id.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered.map((blade) => ({ label: blade.blade_id, value: blade.blade_id })));
  };

 
  const handleSelect = (value) => {
    const selected = data.find((blade) => blade.blade_id === value);
    setSelectedBlade(selected); // Set the selected blade
  };

  return (
    <div className='search'>
      <label>Search Blade Serial Number</label>
      <Select
        showSearch
        value={query} 
        placeholder="Enter Blade Serial Number"
        onSearch={handleSearch} 
        onChange={handleSelect} 
        filterOption={false} 
        style={{ width: 300, marginBottom: 20 }}
        options={filteredOptions}
        allowClear 
      />

      <div>
        <p><strong>Blade Serial Number:</strong> {selectedBlade ? selectedBlade.blade_id : '-'}</p>
        <p><strong>Factory Name:</strong> {selectedBlade ? selectedBlade.factory_name : '-'}</p>
        <p><strong>Blade Cavity:</strong> {selectedBlade ? selectedBlade.location : '-'}</p>
        <p><strong>Inspection Date:</strong> {selectedBlade ? selectedBlade.date.toLocaleDateString() : '-'}</p>
        <p><strong>Annotator:</strong> {selectedBlade ? selectedBlade.inspector : '-'}</p>
        <p><strong>Annotation Status:</strong> {selectedBlade ? selectedBlade.annotationStatus : '-'}</p>
        <p><strong>Total Open Findings:</strong> {selectedBlade ? (selectedBlade.humanOpen + selectedBlade.aiOpen) : '-'}</p>
        <p><strong>Total Closed Findings:</strong> {selectedBlade ? (selectedBlade.humanRepaired + selectedBlade.aiRepaired) : '-'}</p>
       
      </div>
    </div>
  );
}

export default SearchBlade;
