import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import * as d3 from 'd3-fetch';
import { Select } from 'antd'; // for filtering
import { saveAs } from 'file-saver'; // CSV export

export default function InspectionStatus({csvFileUrl}) {
  const [data, setData] = useState([]);
  
  const [yearFilter, setYearFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bladeTypeFilter, setBladeTypeFilter] = useState('');
  const [bladeFilter, setBladeFilter] = useState('');

  const exportToCSV = (data, filename) => {
    if (data.length === 0) return; // avoid erroneous calls
    const csvHeaders = Object.keys(data[0]);
    const csvRows = data.map(row =>
      csvHeaders.map(field => JSON.stringify(row[field])).join(',')
    );
    const csvString = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  // Aggregate data by month and count annotation statuses
  const aggregateByMonth = (filteredData) => {
    const monthlyData = {};

    filteredData.forEach((d) => {
      const monthYear = new Date(d.date.getFullYear(), d.date.getMonth(), 1); 

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          date: monthYear, 
          Complete: 0, 
          Incomplete: 0, 
          Partial: 0, 
          totalAnnotations: 0,
        };
      }

      // Increment counts based on annotation status
      if (d.annotationStatus === 'Complete') {
        monthlyData[monthYear].Complete += 1;
      } else if (d.annotationStatus === 'Incomplete') {
        monthlyData[monthYear].Incomplete += 1;
      } else if (d.annotationStatus === 'Partial') {
        monthlyData[monthYear].Partial += 1;
      }

      // Increment the total annotations count (number of data points)
      monthlyData[monthYear].totalAnnotations += 1;
    });

    // Convert the object to an array and sort by date
    return Object.values(monthlyData).sort((a, b) => a.date - b.date);
  };

  // Fetch the CSV data 
  useEffect(() => {
    //let url = '/DashboardHnData.csv';
    let url = csvFileUrl; // from component parameter
    console.log('InspectionStatus csvFileUrl:',url);
    
    d3.csv(url, (d) => {
      const parsedDate = new Date(d['Upload Date']);

      return {
        date: parsedDate,
        factory_name: d['Factory Name'],
        location: d['Blade Cavity'],
        bladeType: d['Blade Type'],
        annotationStatus: d['Annotation Status'], 
        blade_id: d['Blade ID'],
      };
    })
    .then((csvData) => {
      const validData = csvData.filter(d => !isNaN(d.date)); // Filter invalid dates
      setData(validData); 
    })
    .catch(err => {
      console.error('Error loading CSV:', err);
    });
  }, [csvFileUrl]);

  // Apply filters
  const filteredData = data
    .filter((d) => (yearFilter ? d.date.getFullYear().toString() === yearFilter : true))
    .filter((d) => (factoryFilter ? d.factory_name === factoryFilter : true))
    .filter((d) => (locationFilter ? d.location === locationFilter : true))
    .filter((d) => (bladeFilter ? d.blade_id === bladeFilter : true))
    .filter((d) => (bladeTypeFilter ? d.bladeType === bladeTypeFilter : true));
    

  // Aggregate the filtered data by month
  const aggregatedData = aggregateByMonth(filteredData);

  const years = [...new Set(data.map((d) => d.date.getFullYear()))];
  const factories = [...new Set(data.map((d) => d.factory_name))];
  const locations = [...new Set(data.map((d) => d.location))];
  const blades = [...new Set(data.map((d) => d.blade_id))];
  const bladeType = [...new Set(data.map((d) => d.bladeType))];

  const handleDownload = () => {
    const fullyFilteredData = data
      .filter(d => (yearFilter ? d.date.getFullYear().toString() === yearFilter : true))
      .filter(d => (factoryFilter ? d.factory_name === factoryFilter : true))
      .filter(d => (locationFilter ? d.location === locationFilter : true))
      .filter(d => (bladeTypeFilter ? d.bladeType === bladeTypeFilter : true));

    


    const filteredCsvData = fullyFilteredData.map(row => {
      let filteredRow = {};
      
      filteredRow['date'] = row.date;
      filteredRow['factory_name'] = row.factory_name;
      filteredRow['location'] = row.location;
      filteredRow['bladeType'] = row.bladeType;
      filteredRow['blade_id'] = row.blade_id;
      filteredRow['annotationStatus'] = row.annotationStatus; // Include annotation status
      return filteredRow;
    });

    exportToCSV(filteredCsvData, `Annotation-Status-Data`);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
      <p>Annotation status of "{bladeTypeFilter || 'all'}" blade type at "{locationFilter || 'all cavity areas'}" in "{factoryFilter || 'all factories'}". </p>
        <Select
          placeholder="Year"
          onChange={(value) => setYearFilter(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {years.map((year) => (
            <Select.Option key={year} value={year}>
              {year}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Factory"
          onChange={(value) => setFactoryFilter(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {factories.map((factory) => (
            <Select.Option key={factory} value={factory}>
              {factory}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Cavity"
          onChange={(value) => setLocationFilter(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {locations.map((location) => (
            <Select.Option key={location} value={location}>
              {location}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Blade Type"
          onChange={(value) => setBladeTypeFilter(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {bladeType.map((bladeType) => (
            <Select.Option key={bladeType} value={bladeType}>
              {bladeType}
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Serial Number"
          onChange={(value) => setBladeFilter(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {blades.map((blade_id) => (
            <Select.Option key={blade_id} value={blade_id}>
              {blade_id}
            </Select.Option>
          ))}
        </Select>
        <button onClick={handleDownload} className="DownloadButton">Download Data</button>

      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={aggregatedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })} // Format the date for display
          />
          <YAxis>
            <Label
                value="Number of Blades"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }} 
              /> 
          </YAxis>
          <Tooltip labelFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })} />
          <Legend />
          <Bar dataKey="Complete" stackId="a" fill="#005e60" /> 
          <Bar dataKey="Incomplete" stackId="a" fill="#f19f39" />
          <Bar dataKey="Partial" stackId="a" fill="#f5c147" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
