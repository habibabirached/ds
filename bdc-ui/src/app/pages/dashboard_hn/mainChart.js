import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import * as d3 from 'd3-fetch';
import { Select } from 'antd'; // for filtering
import { saveAs } from 'file-saver'; // CSV export

// import { useScreenshot } from 'use-react-screenshot';

export default function MainChart({csvFileUrl}) {

  // const ref = useRef(null)
  // const [image, takeScreenshot] = useScreenshot()
  // const getImage = () => takeScreenshot(ref.current)


  const [data, setData] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bladeFilter, setBladeFilter] = useState('');
  const [bladeTypeFilter, setBladeTypeFilter] = useState('');
  const [totalOpenFindings, setTotalOpenFindings] = useState(0); 

  const exportToCSV = (data, filename) => {
    if (data.length === 0) return; // avoid erroneous calls

      // Define a mapping from data keys to CSV header labels
    const headerMapping = {
      date: 'Date',
      blade_id: 'Blade ID',
      factory_name: 'Factory Name',
      location: 'Blade Cavity',
      bladeType: 'Blade Type',
      ai: 'Closed (False Positive)',
      aiTolerance: 'AI Within Tolerance',
      aiRepaired: 'Closed (Repaired)',
      aiOpen: 'Open (In Review)',
      aiOut: 'Open (Repair Needed)',
      aiDup: 'Closed (Duplicate)',
      
    };
    
    const csvHeaders = Object.values(headerMapping);
    const csvRows = data.map(row => {
      return Object.keys(headerMapping).map(field =>
        JSON.stringify(row[field])
      ).join(',');
    });
    const csvString = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };
  


 
  const aggregateByMonth = (filteredData) => {
    const monthlyData = {};

    filteredData.forEach((d) => {
      const monthYear = new Date(d.date.getFullYear(), d.date.getMonth(), 1); 

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { date: monthYear, ai: 0, aiTolerance: 0, aiRepaired: 0, aiOpen:0, aiDup:0, aiOut:0};
      }

      monthlyData[monthYear].ai += d.ai; //false positive
      monthlyData[monthYear].aiTolerance += d.aiTolerance; //within tolerance
      monthlyData[monthYear].aiRepaired += d.aiRepaired; //repaired
      monthlyData[monthYear].aiDup += d.aiDup; //close duplicated
      monthlyData[monthYear].aiOut += d.aiOut; //open out of tolerance
      monthlyData[monthYear].aiOpen += d.aiOpen; //open in review
      
      
    });

    
    return Object.values(monthlyData).sort((a, b) => a.date - b.date);
  };


  // Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
        <p >{`Date: ${label.toLocaleString('default', { month: 'long', year: 'numeric' })}`}</p>

        <p style= {{color:"#6EBA8D"}}>{`Open (in review): ${payload[5].value}`}</p>
        <p style= {{color:"#B5FF00"}}>{`Open (Repair needed): ${payload[4].value}`}</p>
        <p style= {{color:"#004E59"}}>{`Closed (Duplicated): ${payload[3].value}`}</p>
        <p style= {{color:"#009FA4"}}>{`Closed (Repaired): ${payload[2].value}`}</p>
        <p style= {{color:"#8F7D62"}}>{`Closed (Within Tolerance): ${payload[1].value}`}</p>
        <p style= {{color:"#F3C147"}}>{`Closed (False Positive): ${payload[0].value}`}</p>
        
        <p style={{ fontWeight: 'bold' }}>{`Total Open Findings: ${payload[4].value + payload[5].value}`}</p>
        <p style={{ fontWeight: 'bold' }}>{`Total Closed Findings: ${payload[0].value + payload[1].value + payload[2].value + + payload[3].value}`}</p>

    
      </div>
    );
  }

    return null;
  };

  const calculateTotalOpenFindings = (data) => {
    return data.reduce((acc, d) => acc + d.aiOpen + d.aiOut, 0);
  };


  // Fetch the CSV data 
  useEffect(() => {
    //let url = '/DashboardHnData.csv';
    let url = csvFileUrl;

    d3.csv(url, (d) => {
      const parsedDate = new Date(d['Upload Date']); 

      return {
        date: parsedDate, 
        blade_id: d['Blade ID'],
        factory_name: d['Factory Name'],
        location: d['Blade Cavity'],
        bladeType: d['Blade Type'],

        ai: parseFloat(d['Total_False_Positive (AI)']) || 0,
        aiTolerance: parseFloat(d['Total_Within_Tolerance (AI)']) || 0,
        aiRepaired: parseFloat(d['Total_Repaired (AI)']) || 0,
        aiOpen: parseFloat(d['Total_Open_No_Disposition (AI)']) || 0,
        aiOut: parseFloat(d['Total_Out_of_Tolerance (AI)']) || 0,
        aiDup: parseFloat(d['Total_Duplicate (AI)']) || 0,


        
      };
    }).then((csvData) => {
      const validData = csvData.filter(d => !isNaN(d.date)); 
      setData(validData); 
    }).catch(err => {
      console.error('Error loading CSV:', err);
    });
  }, [csvFileUrl]);

  // Apply filters BEFORE aggregation
  const filteredData = data
    .filter((d) => (yearFilter ? d.date.getFullYear().toString() === yearFilter : true))
    .filter((d) => (factoryFilter ? d.factory_name === factoryFilter : true))
    .filter((d) => (locationFilter ? d.location === locationFilter : true))
    .filter((d) => (bladeTypeFilter ? d.bladeType === bladeTypeFilter : true))
    .filter((d) => (bladeFilter ? d.blade_id === bladeFilter : true));


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
        filteredRow['ai'] = row.ai;
        filteredRow['aiTolerance'] = row.aiTolerance;
        filteredRow['aiRepaired'] = row.aiRepaired;
        filteredRow['aiOpen'] = row.aiOpen;
        filteredRow['aiOut'] = row.aiOut;
        filteredRow['aiDup'] = row.aiDup;
     
        return filteredRow;
      });
  
      exportToCSV(filteredCsvData, `AI-Finding-Data`);
    };


  // Aggregate the filtered data by month
  const aggregatedData = aggregateByMonth(filteredData);

  // Calculate total open findings after filtering and aggregation
  useEffect(() => {
    const totalOpen = calculateTotalOpenFindings(aggregatedData);
    setTotalOpenFindings(totalOpen);
  }, [aggregatedData]); // Recalculate when aggregatedData changes


  const years = [...new Set(data.map((d) => d.date.getFullYear()))];
  const factories = [...new Set(data.map((d) => d.factory_name))];
  const locations = [...new Set(data.map((d) => d.location))];
  const bladeType = [...new Set(data.map((d) => d.bladeType))];
  const blades = [...new Set(data.map((d) => d.blade_id))];


  return (
    <div>
      <div style={{ marginBottom: '20px' }}  >

      <p>Review status of "{bladeTypeFilter || 'all'}" blade type at "{locationFilter || 'all cavity areas'}" in "{factoryFilter ||'all factories'}". </p>

        {/* Total open findings */}
        <div style={{ margin: '20px 0' }}>
          <h4>Total Open Findings:</h4><h1> {totalOpenFindings}</h1>
        </div>

      
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
        <button onClick={handleDownload} className="DownloadButton">Download Data</button>

        {/* <Select
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
        </Select> */}


        <Legend/>


        
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          width={500}
          height={400}
          data={aggregatedData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })} 
          />
           <YAxis>
            <Label
                value="Number of Findings"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }} 
              /> 
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
       
          <Area type="monotone" dataKey="ai" stackId="1" stroke="#F3C147" fill="#F3C147" /> 
        
          <Area type="monotone" dataKey="aiTolerance" stackId="1" stroke="#8F7D62" fill="#8F7D62" />
        
          <Area type="monotone" dataKey="aiRepaired" stackId="1" stroke="#009FA4" fill="#009FA4" />

          <Area type="monotone" dataKey="aiDup" stackId="1" stroke="#004E59" fill="#004E59" />
       
          <Area type="monotone" dataKey="aiOut" stackId="1" stroke="#B5FF00" fill="#B5FF00" />

          <Area type="monotone" dataKey="aiOpen" stackId="1" stroke="#6EBA8D" fill="#6EBA8D" />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
