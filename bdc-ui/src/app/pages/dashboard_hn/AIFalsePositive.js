import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';
import { csv } from 'd3-fetch';
import { Select } from 'antd'; // for filtering

// Custom active shape for the pie chart
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Value: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 20} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const CustomActiveShapePieChart = ({csvFileUrl}) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState(null);
  const [factories, setFactories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [selectedLocation, setLocationFilter] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const COLORS = ['#0E3A53', '#A7BF7c'];

  // Fetch data from the CSV file
  useEffect(() => {
    let url = csvFileUrl;

    csv(url).then((csvData) => {
  
      const formattedData = csvData.map(row => ({
        factoryName: row['Factory Name'],
        location: row['Blade Cavity'],
        humanFalsePositive: +row['Total_False_Positive (M)'],
        aiFalsePositive: +row['Total_False_Positive (AI)']
      }));

      setData(formattedData);

      // Extract unique factory names and locations for dropdown filters
      const uniqueFactories = [...new Set(formattedData.map(item => item.factoryName))];
      const uniqueLocations = [...new Set(formattedData.map(item => item.location))];

      setFactories(uniqueFactories);
      setLocations(uniqueLocations);
    });
  }, []);

  // Filter data based on dropdown selections
  useEffect(() => {
    const filtered = data.filter(item => {
      const matchesFactory = selectedFactory ? item.factoryName === selectedFactory : true;
      const matchesLocation = selectedLocation ? item.location === selectedLocation : true;
      return matchesFactory && matchesLocation;
    });

    if (filtered.length > 0) {
      const humanTotal = filtered.reduce((acc, curr) => acc + curr.humanFalsePositive, 0);
      const aiTotal = filtered.reduce((acc, curr) => acc + curr.aiFalsePositive, 0);
      setFilteredData([
        { name: 'Human', value: humanTotal },
        { name: 'AI', value: aiTotal }
      ]);
    } else {
      setFilteredData(null);
    }
  }, [selectedFactory, selectedLocation, data, csvFileUrl]);

  // Handle pie chart active sector changes
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <div>
      {/* Dropdown for Factory */}
      <Select
        placeholder="Filter by Factory"
        value={selectedFactory}
        onChange={(value) => setSelectedFactory(value)}
        style={{ width: 150, marginRight: 10 }}
        allowClear
      >
        
        {factories.map((factory) => (
          <Select.Option key={factory} value={factory}>
            {factory}
          </Select.Option>
        ))}
      </Select>

      {/* Dropdown for Cavity */}
      <Select
        placeholder="Filter by Cavity"
        value={selectedLocation}
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

      {/* Pie Chart */}
      {filteredData && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CustomActiveShapePieChart;