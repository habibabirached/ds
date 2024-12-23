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
  const [bladeType, setBladeType] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [selectedLocation, setLocationFilter] = useState(null);
  const [selectedBladeType, setBladeTypeFilter] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const COLORS = [ '#f19f39', '#f5c147','#005e60', '#CCCCCC'];

  // Fetch data from the CSV file
  useEffect(() => {
    //let url = '/DashboardHnData.csv';
    let url = csvFileUrl;

    csv(url).then((csvData) => {
      const formattedData = csvData.map(row => ({
        factoryName: row['Factory Name'],
        location: row['Blade Cavity'],
        bladeType: row['Blade Type'],
        annotationStatus: row['Annotation Status'] || 'Blank', // Handle blank cases
      }));

      setData(formattedData);

      
      const uniqueFactories = [...new Set(formattedData.map(item => item.factoryName))];
      const uniqueLocations = [...new Set(formattedData.map(item => item.location))];
      const uniqueBladeType = [...new Set(formattedData.map(item => item.bladeType))];

      setFactories(uniqueFactories);
      setLocations(uniqueLocations);
      setBladeType(uniqueBladeType);

    });
  }, [csvFileUrl]);

 
  useEffect(() => {
    const filtered = data.filter(item => {
      const matchesFactory = selectedFactory ? item.factoryName === selectedFactory : true;
      const matchesLocation = selectedLocation ? item.location === selectedLocation : true;
      const matchesBladeType = selectedBladeType ? item.bladeType === selectedBladeType : true;
      return matchesFactory && matchesLocation && matchesBladeType;
    });

    if (filtered.length > 0) {
      // Group by annotation status and count occurrences
      const statusCounts = filtered.reduce((acc, curr) => {
        acc[curr.annotationStatus] = (acc[curr.annotationStatus] || 0) + 1;
        return acc;
      }, {});

      const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status],
      }));

      setFilteredData(pieData);
    } else {
      setFilteredData(null);
    }
  }, [selectedFactory, selectedLocation, selectedBladeType, data]);

  // Handle pie chart active sector changes
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // Total number of blades
  const totalBlades = filteredData ? filteredData.reduce((acc, curr) => acc + curr.value, 0) : 0;

  // Total number of incomplete cases
  const incompleteCases = filteredData ? filteredData.reduce((acc, curr) => { 
    return curr.name !== 'Complete' ? acc + curr.value : acc; }, 0) : 0;

  // Total number of complete cases
  const completeCases = filteredData ? filteredData.reduce((acc, curr) => { 
    return curr.name !== 'Incomplete' ? acc + curr.value : acc; }, 0) : 0;

  return (
    <div>
      {/* Dropdown for Factory */}
      <Select
        placeholder="Factory"
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
        placeholder="Cavity"
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

       {/* Dropdown for Blade Type */}
       <Select
        placeholder="Blade Type"
        value={selectedBladeType}
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

      {/* Total blades in review */}
      <div style={{ margin: '20px 0' }}>
        <h4>Incomplete Blades</h4><h1> {incompleteCases}</h1>
      </div>

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
