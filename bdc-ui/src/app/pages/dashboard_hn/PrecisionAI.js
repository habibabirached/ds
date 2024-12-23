import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import * as d3 from 'd3-fetch';

const PrecisionAI = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    d3.csv('/Performance_chart_10_25_2024.csv')
      .then((parsedData) => {
        const formattedData = parsedData.map((item) => ({
          date: new Date(item['X-Values']).getTime(),
          coreGap: item['Core Gap '] ? parseFloat(item['Core Gap '].trim()) : NaN,
          coreGapSampleSize: item['CoreGap Sample Size'] ? +item['CoreGap Sample Size'].trim() : NaN,
          delamination: item['Delamination'] ? parseFloat(item['Delamination'].trim()) : NaN,
          delamSampleSize: item['Delam Sample Size'] ? +item['Delam Sample Size'].trim() : NaN,
          adhesiveVoids: item['Adhesive Voids'] ? parseFloat(item['Adhesive Voids'].trim()) : NaN,
          adhesiveSampleSize: item['Adhesive Sample Size'] ? +item['Adhesive Sample Size'].trim() : NaN,
          dustDirt: item['Dust & Dirt'] ? parseFloat(item['Dust & Dirt'].trim()) : NaN,
          dustDirtSampleSize: item['Dust & Dirt Sample Size'] ? +item['Dust & Dirt Sample Size'].trim() : NaN,
        }));
        setData(formattedData);
      })
      .catch((error) => console.error('Error loading CSV file:', error));
  }, []);


 const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Define the sample size key map at the beginning of the function
      const sampleSizeMap = {
        'Core Gap': 'coreGapSampleSize',
        'Delamination': 'delamSampleSize',
        'Adhesive Voids': 'adhesiveSampleSize',
        'Dust & Dirt': 'dustDirtSampleSize',
      };
  
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }} >
          <p className="label">{`Date: ${formatDate(label)}`}</p>
          
          {payload.map((entry, index) => {
            // Retrieve the relevant sample size key
            const sampleSizeKey = sampleSizeMap[entry.name];
            const sampleSize = entry.payload[sampleSizeKey] || 'N/A'; // Safely retrieve the value or default to 'N/A'
  
            return (
              <div key={index} style={{ marginBottom: '5px' }}>
                <p>{`${entry.name}: ${entry.value}`}</p>
                <p>{`Sample Size: ${sampleSize}`}</p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

 
  return (
    <ResponsiveContainer width='100%' height={400}>
    <ScatterChart  >
      <CartesianGrid />
      <XAxis
        type="number"
        dataKey="date"
        name="Date"
        domain={['dataMin', 'dataMax']}
        tickFormatter={formatDate}
      />
      
      <YAxis type="number" name="Percentage">
            <Label
                value="True Positive Rate"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }} 
              /> 
      </YAxis>

      <Tooltip content={<CustomTooltip />} />
      <Legend />

      {/* Adjust each scatter's size according to the corresponding sample size */}
      <Scatter name="Core Gap" data={data} dataKey="coreGap" fill="#8884d8" size="coreGapSampleSize" />
      <Scatter name="Delamination" data={data} dataKey="delamination" fill="#82ca9d" size="delamSampleSize" />
      <Scatter name="Adhesive Voids" data={data} dataKey="adhesiveVoids" fill="#ffc658" size="adhesiveSampleSize" />
      <Scatter name="Dust & Dirt" data={data} dataKey="dustDirt" fill="#ff7300" size="dustDirtSampleSize" />
    </ScatterChart>
    </ResponsiveContainer>
  );
};

export default PrecisionAI;
