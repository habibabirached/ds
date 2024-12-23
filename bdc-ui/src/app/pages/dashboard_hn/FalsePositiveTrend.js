import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3-fetch';
import { Select } from 'antd';

export default function Example() {
  const [data, setData] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bladeFilter, setBladeFilter] = useState('');


  const aggregateByMonth = (filteredData) => {
    const monthlyData = {};

    filteredData.forEach((d) => {
      const monthYear = new Date(d.date.getFullYear(), d.date.getMonth(), 1); // Get the first day of the month

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { date: monthYear, human: 0, ai: 0 };
      }

      monthlyData[monthYear].human += d.human;
      monthlyData[monthYear].ai += d.ai;
    });


    return Object.values(monthlyData).sort((a, b) => a.date - b.date);
  };

  // Fetch the CSV data 
  useEffect(() => {
    d3.csv('/DashboardHnData.csv', (d) => {
      const parsedDate = new Date(d['Inspection Date']);

      return {
        date: parsedDate, 
        factory_name: d['Factory Name'],
        location: d['Blade Cavity'],
        human: +d['Total_False_Positive (M)'], 
        ai: +d['Total_False_Positive (AI)'], 
        blade_id: d['Blade ID'],
      };
    }).then((csvData) => {
      const validData = csvData.filter(d => !isNaN(d.date)); // Filter invalid dates
      setData(validData); 
    }).catch(err => {
      console.error('Error loading CSV:', err);
    });
  }, []);


  const filteredData = data
    .filter((d) => (yearFilter ? d.date.getFullYear().toString() === yearFilter : true))
    .filter((d) => (factoryFilter ? d.factory_name === factoryFilter : true))
    .filter((d) => (locationFilter ? d.location === locationFilter : true))
    .filter((d) => (bladeFilter ? d.blade_id === bladeFilter : true));

  // Aggregate the filtered data by month
  const aggregatedData = aggregateByMonth(filteredData);

  
  const years = [...new Set(data.map((d) => d.date.getFullYear()))];
  const factories = [...new Set(data.map((d) => d.factory_name))];
  const locations = [...new Set(data.map((d) => d.location))];
  const blades = [...new Set(data.map((d) => d.blade_id))];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Select
          placeholder="Filter by Year"
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
          placeholder="Filter by Factory"
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
          placeholder="Filter by Cavity"
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
          placeholder="Filter by Blade ID"
          onChange={(value) => setBladeFilter(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {blades.map((blade) => (
            <Select.Option key={blade} value={blade}>
              {blade}
            </Select.Option>
          ))}
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          width={500}
          height={300}
          data={aggregatedData}
          margin={{
            top: 5,
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
          <YAxis />
          <Tooltip labelFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })} />
          <Legend />
          <Line type="monotone" dataKey="human" stroke="#0E3A53" strokeWidth={3}  activeDot={{ r: 8 }} /> 
          <Line type="monotone" dataKey="ai" stroke="#A7BF7c" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
