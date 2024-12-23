import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Label } from 'recharts';
import { Select, DatePicker } from 'antd'
import moment from 'moment';
import * as d3 from 'd3-fetch';

const { Option } = Select;

const ZDistance = ({ inspDefCsvFileUrl }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedFindingType, setSelectedFindingType] = useState("");
  const [uniqueLocations, setUniqueLocations] = useState([]);
  const [uniqueFindingTypes, setUniqueFindingTypes] = useState([]);
  const [startDate, setStartDate]  = useState("");
  const [endDate, setEndDate] = useState("");
  const parseDate = date => moment(date); 

  // Fetch the CSV data and process it for unique locations, finding types, and heatmap data
  useEffect(() => {
    let url = inspDefCsvFileUrl;

    d3.csv(url, (d) => {
      const parsedDate = new Date(d['date']); // Parse the date from the CSV

      return {
        date: parsedDate, // Ensure this is a valid Date object
        location: d['cavity'],
        finding_type: d['finding_type'],
        root_face_distance: d['z_distance'],
      };
    })
      .then((csvData) => {
        const validData = csvData.filter(d => !isNaN(d.date)); // Filter rows with valid dates

        // Extract unique locations and finding types for dropdown options
        const uniqueLocations = [...new Set(validData.map(defect => defect.location))];
        const uniqueFindingTypes = [...new Set(validData.map(defect => defect.finding_type))];
        setUniqueLocations(uniqueLocations);
        setUniqueFindingTypes(uniqueFindingTypes);

        const filteredData = validData.filter(defect => {
          const defectDate = defect.date ? parseDate(defect.date) : null;
          return (
            (!selectedLocation || defect.location === selectedLocation) &&
            (!selectedFindingType || defect.finding_type === selectedFindingType) &&
            (!startDate || (defectDate && defectDate.isSameOrAfter(startDate, 'day'))) &&
            (!endDate || (defectDate && defectDate.isSameOrBefore(endDate, 'day'))) &&
            defect.root_face_distance !== ""
          );
        });

        // Aggregate data by root_face_distance
        const aggregatedData = filteredData.reduce((acc, defect) => {
          const distance = parseFloat(defect.root_face_distance);
          if (!isNaN(distance)) {
            if (!acc[distance]) {
              acc[distance] = { x: distance, y: 0, count: 0 };
            }
            acc[distance].y += 1; // Increase frequency count
            acc[distance].count += 1; // Size of bubble
          }
          return acc;
        }, {});

        setHeatmapData(Object.values(aggregatedData));
      })
      .catch(err => {
        console.error('Error loading CSV:', err);
      });
  }, [inspDefCsvFileUrl, selectedLocation, selectedFindingType, startDate, endDate]);

  // Color scaling function based on count
  const getColor = (count) => {
    const maxCount = Math.max(...heatmapData.map(d => d.y), 1); // Avoid division by zero
    const intensity = count / maxCount;
    return `rgba(255, 99, 71, ${intensity + 0.3})`; // Adjust color to a reddish gradient
  };

  return (
    <div>
      <p>Scatter plot showing the relationship between z distance and the number of defect findings.</p>

      {/* Dropdown Filters for Location, Finding Type, and Date Range */}
      <div>
      <Select
          placeholder="Location"
          onChange={(value) => setSelectedLocation(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {uniqueLocations.map((location, index) => (
            <Option key={index} value={location}>
              {location}
            </Option>
          ))}
        </Select>

        
        <Select
          placeholder="Finding Type"
          onChange={(value) => setSelectedFindingType(value)}
          style={{ width: 150, marginRight: 10 }}
          allowClear
        >
          {uniqueFindingTypes.map((type, index) => (
            <Option key={index} value={type}>
              {type}
            </Option>
          ))}
        </Select>
        {/* <DatePicker
          placeholder="Start Date"
          onChange={(date) => setStartDate(date)}
          format="YYYY-MM-DD"
          style={{ marginRight: 10 }}
        />
        
        <DatePicker
          placeholder="End Date"
          onChange={(date) => setEndDate(date)}
          format="YYYY-MM-DD"
        />
     */}
      </div>

      {/* Scatter Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="Root Face Distance" />
          
          <YAxis type="number" dataKey="y" name="Count">
            <Label
                value="Number of Findings"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }} 
              /> 
          </YAxis>

          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter 
            name="Root Face Distance Distribution" 
            data={heatmapData} 
            shape="circle" 
          >
            {heatmapData.map((entry, index) => (
              <Scatter key={`scatter-${index}`} fill={getColor(entry.y)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ZDistance;
