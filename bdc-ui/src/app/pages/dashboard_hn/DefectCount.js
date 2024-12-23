import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import * as d3 from 'd3-fetch';
import { Select } from 'antd'; // for filtering
import { saveAs } from 'file-saver'; // CSV export

export default function DefectCount({csvFileUrl}) {
  const [data, setData] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bladeFilter, setBladeFilter] = useState('');
  const [bladeTypeFilter, setBladeTypeFilter] = useState('');
  //state variable: defect type filter
  const [typeFilter, setTypeFilter] = useState('Delamination');


  //CSV Export
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
          DelaminationAiOpen: 0,
          DelaminationAiOut: 0,
          DelaminationAiFsptv: 0,
          DelaminationAiWnTol: 0,
          DelaminationAiRepair: 0,
          DelaminationAiDup: 0,

          AdhesiveVAiOpen: 0,
          AdhesiveVAiOut: 0,
          AdhesiveVAiFsptv: 0,
          AdhesiveVAiWnTol: 0,
          AdhesiveVAiRepair: 0,
          AdhesiveVAiDup: 0,

          CoreGapAiOpen: 0,
          CoreGapAiOut: 0,
          CoreGapAiFsptv: 0,
          CoreGapAiWnTol: 0,
          CoreGapAiRepair: 0,
          CoreGapAiDup: 0,

          DustDirtAiOpen: 0,
          DustDirtAiOut: 0,
          DustDirtAiFsptv: 0,
          DustDirtAiWnTol: 0,
          DustDirtAiRepair: 0,
          DustDirtAiDup: 0,

          VoidOverlamAiOpen: 0,
          VoidOverlamAiOut: 0,
          VoidOverlamAiFsptv: 0,
          VoidOverlamAiWnTol: 0,
          VoidOverlamAiRepair: 0,
          VoidOverlamAiDup: 0,

        };
      }

      monthlyData[monthYear].DelaminationAiOpen += d.DelaminationAiOpen;
      monthlyData[monthYear].DelaminationAiOut += d.DelaminationAiOut;
      monthlyData[monthYear].DelaminationAiFsptv += d.DelaminationAiFsptv;
      monthlyData[monthYear].DelaminationAiWnTol += d.DelaminationAiWnTol;
      monthlyData[monthYear].DelaminationAiRepair += d.DelaminationAiRepair;
      monthlyData[monthYear].DelaminationAiDup += d.DelaminationAiDup;

      monthlyData[monthYear].AdhesiveVAiOpen += d.AdhesiveVAiOpen;
      monthlyData[monthYear].AdhesiveVAiOut += d.AdhesiveVAiOut;
      monthlyData[monthYear].AdhesiveVAiFsptv += d.AdhesiveVAiFsptv;
      monthlyData[monthYear].AdhesiveVAiWnTol += d.AdhesiveVAiWnTol;
      monthlyData[monthYear].AdhesiveVAiRepair += d.AdhesiveVAiRepair;
      monthlyData[monthYear].AdhesiveVAiDup += d.AdhesiveVAiDup;

      monthlyData[monthYear].CoreGapAiOpen += d.CoreGapAiOpen;
      monthlyData[monthYear].CoreGapAiOut += d.CoreGapAiOut;
      monthlyData[monthYear].CoreGapAiFsptv += d.CoreGapAiFsptv;
      monthlyData[monthYear].CoreGapAiWnTol += d.CoreGapAiWnTol;
      monthlyData[monthYear].CoreGapAiRepair += d.CoreGapAiRepair;
      monthlyData[monthYear].CoreGapAiDup += d.CoreGapAiDup;

      monthlyData[monthYear].DustDirtAiOpen += d.DustDirtAiOpen;
      monthlyData[monthYear].DustDirtAiOut += d.DustDirtAiOut;
      monthlyData[monthYear].DustDirtAiFsptv += d.DustDirtAiFsptv;
      monthlyData[monthYear].DustDirtAiWnTol += d.DustDirtAiWnTol;
      monthlyData[monthYear].DustDirtAiRepair += d.DustDirtAiRepair;
      monthlyData[monthYear].DustDirtAiDup += d.DustDirtAiDup;

      monthlyData[monthYear].VoidOverlamAiOpen += d.VoidOverlamAiOpen;
      monthlyData[monthYear].VoidOverlamAiOut += d.VoidOverlamAiOut;
      monthlyData[monthYear].VoidOverlamAiFsptv += d.VoidOverlamAiFsptv;
      monthlyData[monthYear].VoidOverlamAiWnTol += d.VoidOverlamAiWnTol;
      monthlyData[monthYear].VoidOverlamAiRepair += d.VoidOverlamAiRepair;
      monthlyData[monthYear].VoidOverlamAiDup += d.VoidOverlamAiDup;
     
    });

    // Convert the object to an array and sort by date
    return Object.values(monthlyData).sort((a, b) => a.date - b.date);
  };
  

  // Fetch the CSV data 
  useEffect(() => {
    //let url = '/DashboardHnData.csv';
    let url = csvFileUrl;

    d3.csv(url, (d) => {
      const parsedDate = new Date(d['Upload Date']);

      return {
        date: parsedDate,
        factory_name: d['Factory Name'],
        location: d['Blade Cavity'],
        bladeType: d['Blade Type'],


        DelaminationAiOpen: parseFloat(d['Delamination / LDL (AI) - Open_No_Disposition']) || 0,
        DelaminationAiOut: parseFloat(d['Delamination / LDL (AI) - Out_of_Tolerance']) || 0, //repair needed
        DelaminationAiFsptv: parseFloat(d['Delamination / LDL (AI) - False_Positive']) || 0,
        DelaminationAiWnTol: parseFloat(d['Delamination / LDL (AI) - Within_Tolerance']) || 0,
        DelaminationAiRepair: parseFloat(d['Delamination / LDL (AI) - Repaired']) || 0,
        DelaminationAiDup: parseFloat(d['Delamination / LDL (AI) - Duplicate']) || 0,

        AdhesiveVAiOpen: parseFloat(d['Adhesive Voids (AI) - Open_No_Disposition']) || 0,//in review
        AdhesiveVAiOut: parseFloat(d['Adhesive Voids (AI) - Out_of_Tolerance']) || 0,//repair needed
        AdhesiveVAiFsptv: parseFloat(d['Adhesive Voids (AI) - False_Positive']) || 0,
        AdhesiveVAiWnTol: parseFloat(d['Adhesive Voids (AI) - Within_Tolerance']) || 0,
        AdhesiveVAiRepair: parseFloat(d['Adhesive Voids (AI) - Repaired']) || 0,
        AdhesiveVAiDup: parseFloat(d['Adhesive Voids (AI) - Duplicate']) || 0,

        CoreGapAiOpen: parseFloat(d['CoreGap (AI) - Open_No_Disposition']) || 0,//in review
        CoreGapAiOut: parseFloat(d['CoreGap (AI) - Out_of_Tolerance']) || 0,//repair needed
        CoreGapAiFsptv: parseFloat(d['CoreGap (AI) - False_Positive']) || 0,
        CoreGapAiWnTol: parseFloat(d['CoreGap (AI) - Within_Tolerance']) || 0,
        CoreGapAiRepair: parseFloat(d['CoreGap (AI) - Repaired']) || 0,
        CoreGapAiDup: parseFloat(d['CoreGap (AI) - Duplicate']) || 0,

        DustDirtAiOpen: parseFloat(d['Dust & dirt (AI) - Open_No_Disposition']) || 0,//in review
        DustDirtAiOut: parseFloat(d['Dust & dirt (AI) - Out_of_Tolerance']) || 0,//repair needed
        DustDirtAiFsptv: parseFloat(d['Dust & dirt (AI) - False_Positive']) || 0,
        DustDirtAiWnTol: parseFloat(d['Dust & dirt (AI) - Within_Tolerance']) || 0,
        DustDirtAiRepair: parseFloat(d['Dust & dirt (AI) - Repaired']) || 0,
        DustDirtAiDup: parseFloat(d['Dust & dirt (AI) - Duplicate']) || 0,

        VoidOverlamAiOpen: parseFloat(d['Voids Overlaminate (AI) - Open_No_Disposition']) || 0,//in review
        VoidOverlamAiOut: parseFloat(d['Voids Overlaminate (AI) - Out_of_Tolerance']) || 0,//repair needed
        VoidOverlamAiWnTol: parseFloat(d['Voids Overlaminate (AI) - Within_Tolerance']) || 0,
        VoidOverlamAiFsptv: parseFloat(d['Voids Overlaminate (AI) - False_Positive']) || 0,
        VoidOverlamAiRepair: parseFloat(d['Voids Overlaminate (AI) - Repaired']) || 0,
        VoidOverlamAiDup: parseFloat(d['Voids Overlaminate (AI) - Duplicate']) || 0,

        blade_id: d['Blade ID'],
        ge_disposition: d['ge_disposition']
      };
    }).then((csvData) => {
      const validData = csvData.filter(d => !isNaN(d.date)); // Filter invalid dates
      setData(validData);
    }).catch(err => {
      console.error('Error loading CSV:', err);
    });
  }, [csvFileUrl]);

  // Apply filters
  const filteredData = data
    .filter((d) => (yearFilter ? d.date.getFullYear().toString() === yearFilter : true))
    .filter((d) => (factoryFilter ? d.factory_name === factoryFilter : true))
    .filter((d) => (locationFilter ? d.location === locationFilter : true))
    .filter((d) => (bladeTypeFilter ? d.bladeType === bladeTypeFilter : true));

    const handleDownload = () => {
      const fullyFilteredData = data
        .filter(d => (yearFilter ? d.date.getFullYear().toString() === yearFilter : true))
        .filter(d => (factoryFilter ? d.factory_name === factoryFilter : true))
        .filter(d => (locationFilter ? d.location === locationFilter : true))
        .filter(d => (bladeTypeFilter ? d.bladeType === bladeTypeFilter : true));
  
      const columnsToIncludeMap = defectTypeDataKeys[typeFilter] || {};
      const columnsToIncludeKeys = Object.values(columnsToIncludeMap);
  
      const filteredCsvData = fullyFilteredData.map(row => {
        let filteredRow = {};
        columnsToIncludeKeys.forEach(key => {
          filteredRow[key] = row[key];
        });
        filteredRow['date'] = row.date;
        filteredRow['factory_name'] = row.factory_name;
        filteredRow['location'] = row.location;
        filteredRow['bladeType'] = row.bladeType;
        filteredRow['blade_id'] = row.blade_id;
        return filteredRow;
      });
  
      exportToCSV(filteredCsvData, `filtered-${typeFilter}-data`);
    };


  // Aggregate the filtered data by month
  const aggregatedData = aggregateByMonth(filteredData);

  const years = [...new Set(data.map((d) => d.date.getFullYear()))];
  const factories = [...new Set(data.map((d) => d.factory_name))];
  const locations = [...new Set(data.map((d) => d.location))];
  const bladeType = [...new Set(data.map((d) => d.bladeType))];
 

//mapping the data to the data key
  const defectTypeDataKeys = {
    Delamination: {
      Open: 'DelaminationAiOpen',
      Out: 'DelaminationAiOut',
      FalsePositive: 'DelaminationAiFsptv',
      WithinTolerance: 'DelaminationAiWnTol',
      Repaired: 'DelaminationAiRepair',
      Duplicate: 'DelaminationAiDup',
    },
    AdhesiveV: {
      Open: 'AdhesiveVAiOpen',
      Out: 'AdhesiveVAiOut',
      FalsePositive: 'AdhesiveVAiFsptv',
      WithinTolerance: 'AdhesiveVAiWnTol',
      Repaired: 'AdhesiveVAiRepair',
      Duplicate: 'AdhesiveVAiDup',
    },
    CoreGap: {
      Open: 'CoreGapAiOpen',
      Out: 'CoreGapAiOut',
      FalsePositive: 'CoreGapAiFsptv',
      WithinTolerance: 'CoreGapAiWnTol',
      Repaired: 'CoreGapAiRepair',
      Duplicate: 'CoreGapAiDup',
    },
    DustDirt: {
      Open: 'DustDirtAiOpen',
      Out: 'DustDirtAiOut',
      FalsePositive: 'DustDirtAiFsptv',
      WithinTolerance: 'DustDirtAiWnTol',
      Repaired: 'DustDirtAiRepair',
      Duplicate: 'DustDirtAiDup',
    },

    VoidOverlam: {
      Open: 'VoidOverlamAiOpen',
      Out: 'VoidOverlamAiOut',
      FalsePositive: 'VoidOverlamAiFsptv',
      WithinTolerance: 'VoidOverlamAiWnTol',
      Repaired: 'VoidOverlamAiRepair',
      Duplicate: 'VoidOverlamAiDup',
    },
  };

  //status color 
  const statusColors = {
    Open: '#0E3A53',
    RepairNeeded: '#B5FF00',
    FalsePositive: '#F3C147',
    WithinTolerance: '#8F7D62',
    Repaired: '#009FA4',
    Duplicate: '#004E59',
  };



  return (
    <div>
      <p>Number of findings marked as "{typeFilter}" of "{bladeTypeFilter || 'all'}" blade type at "{locationFilter || 'all cavity areas'}" in "{factoryFilter || 'all factories'}". </p>
      <div style={{ marginBottom: '20px' }}>
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

        {/* select compoment for defect type */}
        <Select
          placeholder="Defect Type"
          onChange={(value) => setTypeFilter(value)} //state variable change
          style={{ width: 150, marginRight: 10 }}
          value={typeFilter}
        >
          <Select.Option value="Delamination">Delamination</Select.Option>
          <Select.Option value="AdhesiveV">Adhesive Void</Select.Option>
          <Select.Option value="CoreGap">Core Gap</Select.Option>
          <Select.Option value="DustDirt">Dust Dirt</Select.Option>
          <Select.Option value="VoidOverlam">Void Overlaminate</Select.Option>

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
            tickFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })}> // Format the date for display
            <Label/> 
            <Label/> 
          </XAxis>
          <YAxis>
            <Label
                value="Number of Findings"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle' }} 
              /> 
          </YAxis>
          <Tooltip labelFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })} />
          <Legend   style={{ marginTop: '20px' }}/>
          
           {/* Dynamically render bars based on the selected defect type */}
            {Object.entries(defectTypeDataKeys[typeFilter] || {}).map(
              ([status, dataKey]) => (
                <Bar
                  key={dataKey}
                  dataKey={dataKey}
                  stackId="a"
                  fill={statusColors[status]}
                  name={status}
                />
              )
            )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
