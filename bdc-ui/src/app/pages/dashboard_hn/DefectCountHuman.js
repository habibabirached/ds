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
  const [bladeTypeFilter, setBladeTypeFilter] = useState('');
  
  //state variable: defect type filter
  const [typeFilter, setTypeFilter] = useState('Delamination');

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

          TotalOpen: 0,
          TotalFsptv:0,
          TotalRepair:0,

          DelaminationMOpen: 0,
          DelaminationMOut: 0,
          DelaminationMFsptv: 0,
          DelaminationMWnTol: 0,
          DelaminationMRepair: 0,
          DelaminationMDup: 0,

          AdhesiveVMOpen: 0,
          AdhesiveVMOut: 0,
          AdhesiveVMFsptv: 0,
          AdhesiveVMWnTol: 0,
          AdhesiveVMRepair: 0,
          AdhesiveVMDup: 0,

          CoreGapMOpen: 0,
          CoreGapMOut: 0,
          CoreGapMFsptv: 0,
          CoreGapMWnTol: 0,
          CoreGapMRepair: 0,
          CoreGapMDup: 0,

          DustDirtMOpen: 0,
          DustDirtMOut: 0,
          DustDirtMFsptv: 0,
          DustDirtMWnTol: 0,
          DustDirtMRepair: 0,
          DustDirtMDup: 0,
         
          AdhesiveCMOpen: 0,
          AdhesiveCMOut: 0,
          AdhesiveCMFsptv: 0,
          AdhesiveCMWnTol: 0,
          AdhesiveCMRepair: 0,
          AdhesiveCMDup: 0,

          CutsWebMOpen: 0,
          CutsWebMOut: 0,
          CutsWebMFsptv: 0,
          CutsWebMWnTol: 0,
          CutsWebMRepair: 0,
          CutsWebMDup: 0,

          DamagedGlassMOpen: 0,
          DamagedGlassMOut: 0,
          DamagedGlassMFsptv: 0,
          DamagedGlassMWnTol: 0,
          DamagedGlassMRepair: 0,
          DamagedGlassMDup: 0,

          EntrainedAirMOpen: 0,
          EntrainedAirMOut: 0,
          EntrainedAirMFsptv: 0,
          EntrainedAirMWnTol: 0,
          EntrainedAirMRepair: 0,
          EntrainedAirMDup: 0,

          MissingLamMOpen: 0,
          MissingLamMOut: 0,
          MissingLamMFsptv: 0,
          MissingLamMWnTol: 0,
          MissingLamMRepair: 0,
          MissingLamMDup: 0,

          ForeignObjectMOpen: 0,
          ForeignObjectMOut: 0,
          ForeignObjectMFsptv: 0,
          ForeignObjectMWnTol: 0,
          ForeignObjectMRepair: 0,
          ForeignObjectMDup: 0,

          LamLooseMOpen: 0,
          LamLooseMOut: 0,
          LamLooseMFsptv: 0,
          LamLooseMWnTol: 0,
          LamLooseMRepair: 0,
          LamLooseMDup: 0,

          LayerEndMOpen: 0,
          LayerEndMOut: 0,
          LayerEndMFsptv: 0,
          LayerEndMWnTol: 0,
          LayerEndMRepair: 0,
          LayerEndMDup: 0,

          LayerMisMOpen: 0,
          LayerMisMOut: 0,
          LayerMisMFsptv: 0,
          LayerMisMWnTol: 0,
          LayerMisMRepair: 0,
          LayerMisMDup: 0,
    
          LayerOverlapMOpen: 0,
          LayerOverlapMOut: 0,
          LayerOverlapMFsptv: 0,
          LayerOverlapMWnTol: 0,
          LayerOverlapMRepair: 0,
          LayerOverlapMDup: 0,

          LPSCableDamageMOpen: 0,
          LPSCableDamageMOut: 0,
          LPSCableDamageMFsptv: 0,
          LPSCableDamageMWnTol: 0,
          LPSCableDamageMRepair: 0,
          LPSCableDamageMDup: 0,
    
          MainWebFootMOpen: 0,
          MainWebFootMOut: 0,
          MainWebFootMFsptv: 0,
          MainWebFootMWnTol: 0,
          MainWebFootMRepair: 0,
          MainWebFootMDup: 0,
    
          MetalShavingsMOpen: 0,
          MetalShavingsMOut: 0,
          MetalShavingsMFsptv: 0,
          MetalShavingsMWnTol: 0,
          MetalShavingsMRepair: 0,
          MetalShavingsMDup: 0,
    
          RCOBracketMOpen: 0,
          RCOBracketMOut: 0,
          RCOBracketMFsptv: 0,
          RCOBracketMWnTol: 0,
          RCOBracketMRepair: 0,
          RCOBracketMDup: 0,
    
          RCOSealMOpen: 0,
          RCOSealMOut: 0,
          RCOSealMFsptv: 0,
          RCOSealMWnTol: 0,
          RCOSealMRepair: 0,
          RCOSealMDup: 0,
    
          IncorrectStaggeringMOpen: 0,
          IncorrectStaggeringMOut: 0,
          IncorrectStaggeringMFsptv: 0,
          IncorrectStaggeringMWnTol: 0,
          IncorrectStaggeringMRepair: 0,
          IncorrectStaggeringMDup: 0,
    
          ShearclipsMOpen: 0,
          ShearclipsMOut: 0,
          ShearclipsMFsptv: 0,
          ShearclipsMWnTol: 0,
          ShearclipsMRepair: 0,
          ShearclipsMDup: 0,
    
          WebFootMOpen: 0,
          WebFootMOut: 0,
          WebFootMFsptv: 0,
          WebFootMWnTol: 0,
          WebFootMRepair: 0,
          WebFootMDup: 0,
    
          TEBCOverlapMOpen: 0,
          TEBCOverlapMOut: 0,
          TEBCOverlapMFsptv: 0,
          TEBCOverlapMWnTol: 0,
          TEBCOverlapMRepair: 0,
          TEBCOverlapMDup: 0,
    
          TEBCPasteThicknessMOpen: 0,
          TEBCPasteThicknessMOut: 0,
          TEBCPasteThicknessMFsptv: 0,
          TEBCPasteThicknessMWnTol: 0,
          TEBCPasteThicknessMRepair: 0,
          TEBCPasteThicknessMDup: 0,
    
          TEBCWaveMOpen: 0,
          TEBCWaveMOut: 0,
          TEBCWaveMFsptv: 0,
          TEBCWaveMWnTol: 0,
          TEBCWaveMRepair: 0,
          TEBCWaveMDup: 0,
    
          UncuredLamMOpen: 0,
          UncuredLamMOut: 0,
          UncuredLamMFsptv: 0,
          UncuredLamMWnTol: 0,
          UncuredLamMRepair: 0,
          UncuredLamMDup: 0,
    
          OtherMOpen: 0,
          OtherMOut: 0,
          OtherMFsptv: 0,
          OtherMWnTol: 0,
          OtherMRepair: 0,
          OtherMDup: 0,
    

        };
      }

      monthlyData[monthYear].TotalOpen += d.TotalOpen;
      
      monthlyData[monthYear].TotalFsptv += d.TotalFsptv;
      monthlyData[monthYear].TotalRepair += d.TotalRepair;

      monthlyData[monthYear].DelaminationMOpen += d.DelaminationMOpen;
      monthlyData[monthYear].DelaminationMOut += d.DelaminationMOut;
      monthlyData[monthYear].DelaminationMFsptv += d.DelaminationMFsptv;
      monthlyData[monthYear].DelaminationMWnTol += d.DelaminationMWnTol;
      monthlyData[monthYear].DelaminationMRepair += d.DelaminationMRepair;
      monthlyData[monthYear].DelaminationMDup += d.DelaminationMDup;

      monthlyData[monthYear].AdhesiveVMOpen += d.AdhesiveVMOpen;
      monthlyData[monthYear].AdhesiveVMOut += d.AdhesiveVMOut;
      monthlyData[monthYear].AdhesiveVMFsptv += d.AdhesiveVMFsptv;
      monthlyData[monthYear].AdhesiveVMWnTol += d.AdhesiveVMWnTol;
      monthlyData[monthYear].AdhesiveVMRepair += d.AdhesiveVMRepair;
      monthlyData[monthYear].AdhesiveVMDup += d.AdhesiveVMDup;

      monthlyData[monthYear].CoreGapMOpen += d.CoreGapMOpen;
      monthlyData[monthYear].CoreGapMOut += d.CoreGapMOut;
      monthlyData[monthYear].CoreGapMFsptv += d.CoreGapMFsptv;
      monthlyData[monthYear].CoreGapMWnTol += d.CoreGapMWnTol;
      monthlyData[monthYear].CoreGapMRepair += d.CoreGapMRepair;
      monthlyData[monthYear].CoreGapMDup += d.CoreGapMDup;

      monthlyData[monthYear].DustDirtMOpen += d.DustDirtMOpen;
      monthlyData[monthYear].DustDirtMOut += d.DustDirtMOut;
      monthlyData[monthYear].DustDirtMFsptv += d.DustDirtMFsptv;
      monthlyData[monthYear].DustDirtMWnTol += d.DustDirtMWnTol;
      monthlyData[monthYear].DustDirtMRepair += d.DustDirtMRepair;
      monthlyData[monthYear].DustDirtMDup += d.DustDirtMDup;

      monthlyData[monthYear].AdhesiveCMOpen += d.AdhesiveCMOpen;
      monthlyData[monthYear].AdhesiveCMOut += d.AdhesiveCMOut;
      monthlyData[monthYear].AdhesiveCMFsptv += d.AdhesiveCMFsptv;
      monthlyData[monthYear].AdhesiveCMWnTol += d.AdhesiveCMWnTol;
      monthlyData[monthYear].AdhesiveCMRepair += d.AdhesiveCMRepair;
      monthlyData[monthYear].AdhesiveCMDup += d.AdhesiveCMDup;

      monthlyData[monthYear].CutsWebMOpen += d.CutsWebMOpen;
      monthlyData[monthYear].CutsWebMOut += d.CutsWebMOut;
      monthlyData[monthYear].CutsWebMFsptv += d.CutsWebMFsptv;
      monthlyData[monthYear].CutsWebMWnTol += d.CutsWebMWnTol;
      monthlyData[monthYear].CutsWebMRepair += d.CutsWebMRepair;
      monthlyData[monthYear].CutsWebMDup += d.CutsWebMDup;

      monthlyData[monthYear].DamagedGlassMOpen += d.DamagedGlassMOpen;
      monthlyData[monthYear].DamagedGlassMOut += d.DamagedGlassMOut;
      monthlyData[monthYear].DamagedGlassMFsptv += d.DamagedGlassMFsptv;
      monthlyData[monthYear].DamagedGlassMWnTol += d.DamagedGlassMWnTol;
      monthlyData[monthYear].DamagedGlassMRepair += d.DamagedGlassMRepair;
      monthlyData[monthYear].DamagedGlassMDup += d.DamagedGlassMDup;

      monthlyData[monthYear].EntrainedAirMOpen += d.EntrainedAirMOpen;
      monthlyData[monthYear].EntrainedAirMOut += d.EntrainedAirMOut;
      monthlyData[monthYear].EntrainedAirMFsptv += d.EntrainedAirMFsptv;
      monthlyData[monthYear].EntrainedAirMWnTol += d.EntrainedAirMWnTol;
      monthlyData[monthYear].EntrainedAirMRepair += d.EntrainedAirMRepair;
      monthlyData[monthYear].EntrainedAirMDup += d.EntrainedAirMDup;

      monthlyData[monthYear].MissingLamMOpen += d.MissingLamMOpen;
      monthlyData[monthYear].MissingLamMOut += d.MissingLamMOut;
      monthlyData[monthYear].MissingLamMFsptv += d.MissingLamMFsptv;
      monthlyData[monthYear].MissingLamMWnTol += d.MissingLamMWnTol;
      monthlyData[monthYear].MissingLamMRepair += d.MissingLamMRepair;
      monthlyData[monthYear].MissingLamMDup += d.MissingLamMDup;

      monthlyData[monthYear].ForeignObjectMOpen += d.ForeignObjectMOpen;
      monthlyData[monthYear].ForeignObjectMOut += d.ForeignObjectMOut;
      monthlyData[monthYear].ForeignObjectMFsptv += d.ForeignObjectMFsptv;
      monthlyData[monthYear].ForeignObjectMWnTol += d.ForeignObjectMWnTol;
      monthlyData[monthYear].ForeignObjectMRepair += d.ForeignObjectMRepair;
      monthlyData[monthYear].ForeignObjectMDup += d.ForeignObjectMDup;

      monthlyData[monthYear].LamLooseMOpen += d.LamLooseMOpen;
      monthlyData[monthYear].LamLooseMOut += d.LamLooseMOut;
      monthlyData[monthYear].LamLooseMFsptv += d.LamLooseMFsptv;
      monthlyData[monthYear].LamLooseMWnTol += d.LamLooseMWnTol;
      monthlyData[monthYear].LamLooseMRepair += d.LamLooseMRepair;
      monthlyData[monthYear].LamLooseMDup += d.LamLooseMDup;

      monthlyData[monthYear].LayerEndMOpen += d.LayerEndMOpen;
      monthlyData[monthYear].LayerEndMOut += d.LayerEndMOut;
      monthlyData[monthYear].LayerEndMFsptv += d.LayerEndMFsptv;
      monthlyData[monthYear].LayerEndMWnTol += d.LayerEndMWnTol;
      monthlyData[monthYear].LayerEndMRepair += d.LayerEndMRepair;
      monthlyData[monthYear].LayerEndMDup += d.LayerEndMDup;

      monthlyData[monthYear].LayerMisMOpen += d.LayerMisMOpen;
      monthlyData[monthYear].LayerMisMOut += d.LayerMisMOut;
      monthlyData[monthYear].LayerMisMFsptv += d.LayerMisMFsptv;
      monthlyData[monthYear].LayerEndMWnTol += d.LayerMisMWnTol;
      monthlyData[monthYear].LayerMisMRepair += d.LayerMisMRepair;
      monthlyData[monthYear].LayerMisMDup += d.LayerMisMDup;

      monthlyData[monthYear].LayerOverlapMOpen += d.LayerOverlapMOpen;
      monthlyData[monthYear].LayerOverlapMOut += d.LayerOverlapMOut;
      monthlyData[monthYear].LayerOverlapMFsptv += d.LayerOverlapMFsptv;
      monthlyData[monthYear].LayerOverlapMWnTol += d.LayerOverlapMWnTol;
      monthlyData[monthYear].LayerOverlapMRepair += d.LayerOverlapMRepair;
      monthlyData[monthYear].LayerOverlapMDup += d.LayerOverlapMDup;

      monthlyData[monthYear].LPSCableDamageMOpen += d.LPSCableDamageMOpen;
      monthlyData[monthYear].LPSCableDamageMOut += d.LPSCableDamageMOut;
      monthlyData[monthYear].LPSCableDamageMFsptv += d.LPSCableDamageMFsptv;
      monthlyData[monthYear].LPSCableDamageMWnTol += d.LPSCableDamageMWnTol;
      monthlyData[monthYear].LPSCableDamageMRepair += d.LPSCableDamageMRepair;
      monthlyData[monthYear].LPSCableDamageMDup += d.LPSCableDamageMDup;

      monthlyData[monthYear].MainWebFootMOpen += d.MainWebFootMOpen;
      monthlyData[monthYear].MainWebFootMOut += d.MainWebFootMOut;
      monthlyData[monthYear].MainWebFootMFsptv += d.MainWebFootMFsptv;
      monthlyData[monthYear].MainWebFootMWnTol += d.MainWebFootMWnTol;
      monthlyData[monthYear].MainWebFootMRepair += d.MainWebFootMRepair;
      monthlyData[monthYear].MainWebFootMDup += d.MainWebFootMDup;

      monthlyData[monthYear].MetalShavingsMOpen += d.MetalShavingsMOpen;
      monthlyData[monthYear].MetalShavingsMOut += d.MetalShavingsMOut;
      monthlyData[monthYear].MetalShavingsMFsptv += d.MetalShavingsMFsptv;
      monthlyData[monthYear].MetalShavingsMWnTol += d.MetalShavingsMWnTol;
      monthlyData[monthYear].MetalShavingsMRepair += d.MetalShavingsMRepair;
      monthlyData[monthYear].MetalShavingsMDup += d.MetalShavingsMDup;

      monthlyData[monthYear].RCOBracketMOpen += d.RCOBracketMOpen;
      monthlyData[monthYear].RCOBracketMOut += d.RCOBracketMOut;
      monthlyData[monthYear].RCOBracketMFsptv += d.RCOBracketMFsptv;
      monthlyData[monthYear].RCOBracketMWnTol += d.RCOBracketMWnTol;
      monthlyData[monthYear].RCOBracketMRepair += d.RCOBracketMRepair;
      monthlyData[monthYear].RCOBracketMDup += d.RCOBracketMDup;

      monthlyData[monthYear].RCOSealMOpen += d.RCOSealMOpen;
      monthlyData[monthYear].RCOSealMOut += d.RCOSealMOut;
      monthlyData[monthYear].RCOSealMFsptv += d.RCOSealMFsptv;
      monthlyData[monthYear].RCOSealMWnTol += d.RCOSealMWnTol;
      monthlyData[monthYear].RCOSealMRepair += d.RCOSealMRepair;
      monthlyData[monthYear].RCOSealMDup += d.RCOSealMDup;

      monthlyData[monthYear].IncorrectStaggeringMOpen += d.IncorrectStaggeringMOpen;
      monthlyData[monthYear].IncorrectStaggeringMOut += d.IncorrectStaggeringMOut;
      monthlyData[monthYear].IncorrectStaggeringMFsptv += d.IncorrectStaggeringMFsptv;
      monthlyData[monthYear].IncorrectStaggeringMWnTol += d.IncorrectStaggeringMWnTol;
      monthlyData[monthYear].IncorrectStaggeringMRepair += d.IncorrectStaggeringMRepair;
      monthlyData[monthYear].IncorrectStaggeringMDup += d.IncorrectStaggeringMDup;

      monthlyData[monthYear].ShearclipsMOpen += d.ShearclipsMOpen;
      monthlyData[monthYear].ShearclipsMOut += d.ShearclipsMOut;
      monthlyData[monthYear].ShearclipsMFsptv += d.ShearclipsMFsptv;
      monthlyData[monthYear].ShearclipsMWnTol += d.ShearclipsMWnTol;
      monthlyData[monthYear].ShearclipsMRepair += d.ShearclipsMRepair;
      monthlyData[monthYear].ShearclipsMDup += d.ShearclipsMDup;

      monthlyData[monthYear].WebFootMOpen += d.WebFootMOpen;
      monthlyData[monthYear].WebFootMOut += d.WebFootMOut;
      monthlyData[monthYear].WebFootMFsptv += d.WebFootMFsptv;
      monthlyData[monthYear].WebFootMWnTol += d.WebFootMWnTol;
      monthlyData[monthYear].WebFootMRepair += d.WebFootMRepair;
      monthlyData[monthYear].WebFootMDup += d.WebFootMDup;

      monthlyData[monthYear].TEBCOverlapMOpen += d.TEBCOverlapMOpen;
      monthlyData[monthYear].TEBCOverlapMOut += d.TEBCOverlapMOut;
      monthlyData[monthYear].TEBCOverlapMFsptv += d.TEBCOverlapMFsptv;
      monthlyData[monthYear].TEBCOverlapMWnTol += d.TEBCOverlapMWnTol;
      monthlyData[monthYear].TEBCOverlapMRepair += d.TEBCOverlapMRepair;
      monthlyData[monthYear].TEBCOverlapMDup += d.TEBCOverlapMDup;

      monthlyData[monthYear].TEBCPasteThicknessMOpen += d.TEBCPasteThicknessMOpen;
      monthlyData[monthYear].TEBCPasteThicknessMOut += d.TEBCPasteThicknessMOut;
      monthlyData[monthYear].TEBCPasteThicknessMFsptv += d.TEBCPasteThicknessMFsptv;
      monthlyData[monthYear].TEBCPasteThicknessMWnTol += d.TEBCPasteThicknessMWnTol;
      monthlyData[monthYear].TEBCPasteThicknessMRepair += d.TEBCPasteThicknessMRepair;
      monthlyData[monthYear].TEBCPasteThicknessMDup += d.TEBCPasteThicknessMDup;

      monthlyData[monthYear].TEBCWaveMOpen += d.TEBCWaveMOpen;
      monthlyData[monthYear].TEBCWaveMOut += d.TEBCWaveMOut;
      monthlyData[monthYear].TEBCWaveMFsptv += d.TEBCWaveMFsptv;
      monthlyData[monthYear].TEBCWaveMWnTol += d.TEBCWaveMWnTol;
      monthlyData[monthYear].TEBCWaveMRepair += d.TEBCWaveMRepair;
      monthlyData[monthYear].TEBCWaveMDup += d.TEBCWaveMDup;

      monthlyData[monthYear].UncuredLamMOpen += d.UncuredLamMOpen;
      monthlyData[monthYear].UncuredLamMOut += d.UncuredLamMOut;
      monthlyData[monthYear].UncuredLamMFsptv += d.UncuredLamMFsptv;
      monthlyData[monthYear].UncuredLamMWnTol += d.UncuredLamMWnTol;
      monthlyData[monthYear].UncuredLamMRepair += d.UncuredLamMRepair;
      monthlyData[monthYear].UncuredLamMDup += d.UncuredLamMDup;

      monthlyData[monthYear].OtherMOpen += d.OtherMOpen;
      monthlyData[monthYear].OtherMOut += d.OtherMOut;
      monthlyData[monthYear].OtherMFsptv += d.OtherMFsptv;
      monthlyData[monthYear].OtherMWnTol += d.OtherMWnTol;
      monthlyData[monthYear].OtherMRepair += d.OtherMRepair;
      monthlyData[monthYear].OtherMDup += d.OtherMDup;



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

        TotalOpen: +d['Total_Open (AI)'],
        TotalFsptv:+d['Total_False_Positive (AI)'],
        TotalRepair:+d['Total_Repaired (AI)'],

        DelaminationMOpen: parseFloat(d['Delamination / LDL (M) - Open_No_Disposition']) || 0,
        DelaminationMOut: parseFloat(d['Delamination / LDL (M) - Out_of_Tolerance']) || 0,
        DelaminationMFsptv: parseFloat(d['Delamination / LDL (M) - False_Positive']) || 0,
        DelaminationMWnTol: parseFloat(d['Delamination / LDL (M) - Within_Tolerance']) || 0,
        DelaminationMRepair: parseFloat(d['Delamination / LDL (M) - Repaired']) || 0,
        DelaminationMDup: parseFloat(d['Delamination / LDL (M) - Duplicate']) || 0,

        AdhesiveVMOpen: parseFloat(d['Adhesive Voids (M) - Open_No_Disposition']) || 0,
        AdhesiveVMOut: parseFloat(d['Adhesive Voids (M) - Out_of_Tolerance']) || 0,
        AdhesiveVMFsptv: parseFloat(d['Adhesive Voids (M) - False_Positive']) || 0,
        AdhesiveVMWnTol: parseFloat(d['Adhesive Voids (M) - Within_Tolerance']) || 0,
        AdhesiveVMRepair: parseFloat(d['Adhesive Voids (M) - Repaired']) || 0,
        AdhesiveVMDup: parseFloat(d['Adhesive Voids (M) - Duplicate']) || 0,

        CoreGapMOpen: parseFloat(d['CoreGap (M) - Open_No_Disposition']) || 0,
        CoreGapMOut: parseFloat(d['CoreGap (M) - Out_of_Tolerance']) || 0,
        CoreGapMFsptv: parseFloat(d['CoreGap (M) - False_Positive']) || 0,
        CoreGapMWnTol: parseFloat(d['CoreGap (M) - Within_Tolerance']) || 0,
        CoreGapMRepair: parseFloat(d['CoreGap (M) - Repaired']) || 0,
        CoreGapMDup: parseFloat(d['CoreGap (M) - Duplicate']) || 0,

        DustDirtMOpen: parseFloat(d['Dust & dirt (M) - Open_No_Disposition']) || 0,
        DustDirtMOut: parseFloat(d['Dust & dirt (M) - Out_of_Tolerance']) || 0,
        DustDirtMFsptv: parseFloat(d['Dust & dirt (M) - False_Positive']) || 0,
        DustDirtMWnTol: parseFloat(d['Dust & dirt (M) - Within_Tolerance']) || 0,
        DustDirtMRepair: parseFloat(d['Dust & dirt (M) - Repaired']) || 0,
        DustDirtMDup: parseFloat(d['Dust & dirt (M) - Duplicate']) || 0,

        AdhesiveCMOpen: parseFloat(d['Adhesive Cracks (M) - Open_No_Disposition']) || 0,
        AdhesiveCMOut: parseFloat(d['Adhesive Cracks (M) - Out_of_Tolerance']) || 0,
        AdhesiveCMFsptv: parseFloat(d['Adhesive Cracks (M) - False_Positive']) || 0,
        AdhesiveCMWnTol: parseFloat(d['Adhesive Cracks (M) - Within_Tolerance']) || 0,
        AdhesiveCMRepair: parseFloat(d['Adhesive Cracks (M) - Repaired']) || 0,
        AdhesiveCMDup: parseFloat(d['Adhesive Cracks (M) - Duplicate']) || 0,

        CutsWebMOpen: parseFloat(d['Cuts in Web Flange (M) - Open_No_Disposition']) || 0,
        CutsWebMOut: parseFloat(d['Cuts in Web Flange (M) - Out_of_Tolerance']) || 0,
        CutsWebMFsptv: parseFloat(d['Cuts in Web Flange (M) - False_Positive']) || 0,
        CutsWebMWnTol: parseFloat(d['Cuts in Web Flange (M) - Within_Tolerance']) || 0,
        CutsWebMRepair: parseFloat(d['Cuts in Web Flange (M) - Repaired']) || 0,
        CutsWebMDup: parseFloat(d['Cuts in Web Flange (M) - Duplicate']) || 0,

        DamagedGlassMOpen: parseFloat(d['Damaged Glass (M) - Open_No_Disposition']) || 0,
        DamagedGlassMOut: parseFloat(d['Damaged Glass (M) - Out_of_Tolerance']) || 0,
        DamagedGlassMFsptv: parseFloat(d['Damaged Glass (M) - False_Positive']) || 0,
        DamagedGlassMWnTol: parseFloat(d['Damaged Glass (M) - Within_Tolerance']) || 0,
        DamagedGlassMRepair: parseFloat(d['Damaged Glass (M) - Repaired']) || 0,
        DamagedGlassMDup:  parseFloat(d['Damaged Glass (M) - Duplicate']) || 0,

        EntrainedAirMOpen: parseFloat(d['Entrained air (M) - Open_No_Disposition']) || 0,
        EntrainedAirMOut: parseFloat(d['Entrained air (M) - Out_of_Tolerance']) || 0,
        EntrainedAirMFsptv: parseFloat(d['Entrained air (M) - False_Positive']) || 0,
        EntrainedAirMWnTol: parseFloat(d['Entrained air (M) - Within_Tolerance']) || 0,
        EntrainedAirMRepair: parseFloat(d['Entrained air (M) - Repaired']) || 0,
        EntrainedAirMDup: parseFloat(d['Entrained air (M) - Duplicate']) || 0,

        MissingLamMOpen: parseFloat(d['Exposed core / Missing laminate (M) - Open_No_Disposition']) || 0,
        MissingLamMOut: parseFloat(d['Exposed core / Missing laminate (M) - Out_of_Tolerance']) || 0,
        MissingLamMFsptv: parseFloat(d['Exposed core / Missing laminate (M) - False_Positive']) || 0,
        MissingLamMWnTol: parseFloat(d['Exposed core / Missing laminate (M) - Within_Tolerance']) || 0,
        MissingLamMRepair: parseFloat(d['Exposed core / Missing laminate (M) - Repaired']) || 0,
        MissingLamMDup: parseFloat(d['Exposed core / Missing laminate (M) - Duplicate']) || 0,

        ForeignObjectMOpen: parseFloat(d['Foreign Objects (M) - Open_No_Disposition']) || 0,
        ForeignObjectMOut: parseFloat(d['Foreign Objects (M) - Out_of_Tolerance']) || 0,
        ForeignObjectMFsptv: parseFloat(d['Foreign Objects (M) - False_Positive']) || 0,
        ForeignObjectMWnTol: parseFloat(d['Foreign Objects (M) - Within_Tolerance']) || 0,
        ForeignObjectMRepair: parseFloat(d['Foreign Objects (M) - Repaired']) || 0,
        ForeignObjectMDup: parseFloat(d['Foreign Objects (M) - Duplicate']) || 0,

        LamLooseMOpen: parseFloat(d['Laminate Loose Edge (M) - Open_No_Disposition']) || 0,
        LamLooseMOut: parseFloat(d['Laminate Loose Edge (M) - Out_of_Tolerance']) || 0,
        LamLooseMFsptv: parseFloat(d['Laminate Loose Edge (M) - False_Positive']) || 0,
        LamLooseMWnTol: parseFloat(d['Laminate Loose Edge (M) - Within_Tolerance']) || 0,
        LamLooseMRepair: parseFloat(d['Laminate Loose Edge (M) - Repaired']) || 0,
        LamLooseMDup: parseFloat(d['Laminate Loose Edge (M) - Duplicate']) || 0,

        LayerEndMOpen: parseFloat(d['Layer end (M) - Open_No_Disposition']) || 0,
        LayerEndMOut: parseFloat(d['Layer end (M) - Out_of_Tolerance']) || 0,
        LayerEndMFsptv: parseFloat(d['Layer end (M) - False_Positive']) || 0,
        LayerEndMWnTol: parseFloat(d['Layer end (M) - Within_Tolerance']) || 0,
        LayerEndMRepair: parseFloat(d['Layer end (M) - Repaired']) || 0,
        LayerEndMDup: parseFloat(d['Layer end (M) - Duplicate']) || 0,

        LayerMisMOpen: parseFloat(d['Layer misplacement (AI) - Open_No_Disposition']) || 0,
        LayerMisMOut: parseFloat(d['Layer misplacement (AI) - Out_of_Tolerance']) || 0,
        LayerMisMFsptv: parseFloat(d['Layer misplacement (AI) - False_Positive']) || 0,
        LayerMisMWnTol: parseFloat(d['Layer misplacement (AI) - Within_Tolerance']) || 0,
        LayerMisMRepair: parseFloat(d['Layer misplacement (AI) - Repaired']) || 0,
        LayerMisMDup: parseFloat(d['Layer misplacement (AI) - Duplicate']) || 0,

        LayerOverlapMOpen: parseFloat(d['Layers Overlap (M) - Open_No_Disposition']) || 0,
        LayerOverlapMOut: parseFloat(d['Layers Overlap (M) - Out_of_Tolerance']) || 0,
        LayerOverlapMFsptv: parseFloat(d['Layers Overlap (M) - False_Positive']) || 0,
        LayerOverlapMWnTol: parseFloat(d['Layers Overlap (M) - Within_Tolerance']) || 0,
        LayerOverlapMRepair: parseFloat(d['Layers Overlap (M) - Repaired']) || 0,
        LayerOverlapMDup: parseFloat(d['Layers Overlap (M) - Duplicate']) || 0,

        LPSCableDamageMOpen: parseFloat(d['LPS Cable Damage (M) - Open_No_Disposition']) || 0,
        LPSCableDamageMOut: parseFloat(d['LPS Cable Damage (M) - Out_of_Tolerance']) || 0,
        LPSCableDamageMFsptv: parseFloat(d['LPS Cable Damage (M) - False_Positive']) || 0,
        LPSCableDamageMWnTol: parseFloat(d['LPS Cable Damage (M) - Within_Tolerance']) || 0,
        LPSCableDamageMRepair: parseFloat(d['LPS Cable Damage (M) - Repaired']) || 0,
        LPSCableDamageMDup: parseFloat(d['LPS Cable Damage (M) - Duplicate']) || 0,

        MainWebFootMOpen: parseFloat(d['Main SW Web Foot Lam (M) - Open_No_Disposition']) || 0,
        MainWebFootMOut: parseFloat(d['Main SW Web Foot Lam (M) - Out_of_Tolerance']) || 0,
        MainWebFootMFsptv: parseFloat(d['Main SW Web Foot Lam (M) - False_Positive']) || 0,
        MainWebFootMWnTol: parseFloat(d['Main SW Web Foot Lam (M) - Within_Tolerance']) || 0,
        MainWebFootMRepair: parseFloat(d['Main SW Web Foot Lam (M) - Repaired']) || 0,
        MainWebFootMDup: parseFloat(d['Main SW Web Foot Lam (M) - Duplicate']) || 0,

        MetalShavingsMOpen: parseFloat(d['Metal Shavings (M) - Open_No_Disposition']) || 0,
        MetalShavingsMOut: parseFloat(d['Metal Shavings (M) - Out_of_Tolerance']) || 0,
        MetalShavingsMFsptv: parseFloat(d['Metal Shavings (M) - False_Positive']) || 0,
        MetalShavingsMWnTol: parseFloat(d['Metal Shavings (M) - Within_Tolerance']) || 0,
        MetalShavingsMRepair: parseFloat(d['Metal Shavings (M) - Repaired']) || 0,
        MetalShavingsMDup: parseFloat(d['Metal Shavings (M) - Duplicate']) || 0,

        RCOBracketMOpen: parseFloat(d['RCO Bracket bond (M) - Open_No_Disposition']) || 0,
        RCOBracketMOut: parseFloat(d['RCO Bracket bond (M) - Out_of_Tolerance']) || 0,
        RCOBracketMFsptv: parseFloat(d['RCO Bracket bond (M) - False_Positive']) || 0,
        RCOBracketMWnTol: parseFloat(d['RCO Bracket bond (M) - Within_Tolerance']) || 0,
        RCOBracketMRepair: parseFloat(d['RCO Bracket bond (M) - Repaired']) || 0,
        RCOBracketMDup: parseFloat(d['RCO Bracket bond (M) - Duplicate']) || 0,

        RCOSealMOpen: parseFloat(d['RCO Seal (M) - Open_No_Disposition']) || 0,
        RCOSealMOut: parseFloat(d['RCO Seal (M) - Out_of_Tolerance']) || 0,
        RCOSealMFsptv: parseFloat(d['RCO Seal (M) - False_Positive']) || 0,
        RCOSealMWnTol: parseFloat(d['RCO Seal (M) - Within_Tolerance']) || 0,
        RCOSealMRepair: parseFloat(d['RCO Seal (M) - Repaired']) || 0,
        RCOSealMDup: parseFloat(d['RCO Seal (M) - Duplicate']) || 0,

        IncorrectStaggeringMOpen: parseFloat(d['Repairs incorrect staggering (M) - Open_No_Disposition']) || 0,
        IncorrectStaggeringMOut: parseFloat(d['Repairs incorrect staggering (M) - Out_of_Tolerance']) || 0,
        IncorrectStaggeringMFsptv: parseFloat(d['Repairs incorrect staggering (M) - False_Positive']) || 0,
        IncorrectStaggeringMWnTol: parseFloat(d['Repairs incorrect staggering (M) - Within_Tolerance']) || 0,
        IncorrectStaggeringMRepair: parseFloat(d['Repairs incorrect staggering (M) - Repaired']) || 0,
        IncorrectStaggeringMDup: parseFloat(d['Repairs incorrect staggering (M) - Duplicate']) || 0,

        ShearclipsMOpen: parseFloat(d['Shearclips missing (M) - Open_No_Disposition']) || 0,
        ShearclipsMOut: parseFloat(d['Shearclips missing (M) - Out_of_Tolerance']) || 0,
        ShearclipsMFsptv: parseFloat(d['Shearclips missing (M) - False_Positive']) || 0,
        ShearclipsMWnTol: parseFloat(d['Shearclips missing (M) - Within_Tolerance']) || 0,
        ShearclipsMRepair: parseFloat(d['Shearclips missing (M) - Repaired']) || 0,
        ShearclipsMDup: parseFloat(d['Shearclips missing (M) - Duplicate']) || 0,

        WebFootMOpen: parseFloat(d['TE SW Web Foot Lam (M) - Open_No_Disposition']) || 0,
        WebFootMOut: parseFloat(d['TE SW Web Foot Lam (M) - Out_of_Tolerance']) || 0,
        WebFootMFsptv: parseFloat(d['TE SW Web Foot Lam (M) - False_Positive']) || 0,
        WebFootMWnTol: parseFloat(d['TE SW Web Foot Lam (M) - Within_Tolerance']) || 0,
        WebFootMRepair: parseFloat(d['TE SW Web Foot Lam (M) - Repaired']) || 0,
        WebFootMDup: parseFloat(d['TE SW Web Foot Lam (M) - Duplicate']) || 0,

        TEBCOverlapMOpen: parseFloat(d['TEBC Overlam Overlap (M) - Open_No_Disposition']) || 0,
        TEBCOverlapMOut: parseFloat(d['TEBC Overlam Overlap (M) - Out_of_Tolerance']) || 0,
        TEBCOverlapMFsptv: parseFloat(d['TEBC Overlam Overlap (M) - False_Positive']) || 0,
        TEBCOverlapMWnTol: parseFloat(d['TEBC Overlam Overlap (M) - Within_Tolerance']) || 0,
        TEBCOverlapMRepair: parseFloat(d['TEBC Overlam Overlap (M) - Repaired']) || 0,
        TEBCOverlapMDup: parseFloat(d['TEBC Overlam Overlap (M) - Duplicate']) || 0,

        TEBCPasteThicknessMOpen: parseFloat(d['TEBC Paste Thickness (M) - Open_No_Disposition']) || 0,
        TEBCPasteThicknessMOut: parseFloat(d['TEBC Paste Thickness (M) - Out_of_Tolerance']) || 0,
        TEBCPasteThicknessMFsptv: parseFloat(d['TEBC Paste Thickness (M) - False_Positive']) || 0,
        TEBCPasteThicknessMWnTol: parseFloat(d['TEBC Paste Thickness (M) - Within_Tolerance']) || 0,
        TEBCPasteThicknessMRepair: parseFloat(d['TEBC Paste Thickness (M) - Repaired']) || 0,
        TEBCPasteThicknessMDup: parseFloat(d['TEBC Paste Thickness (M) - Duplicate']) || 0,

        TEBCWaveMOpen: parseFloat(d['TEBC Wave (M) - Open_No_Disposition']) || 0,
        TEBCWaveMOut: parseFloat(d['TEBC Wave (M) - Out_of_Tolerance']) || 0,
        TEBCWaveMFsptv: parseFloat(d['TEBC Wave (M) - False_Positive']) || 0,
        TEBCWaveMWnTol: parseFloat(d['TEBC Wave (M) - Within_Tolerance']) || 0,
        TEBCWaveMRepair: parseFloat(d['TEBC Wave (M) - Repaired']) || 0,
        TEBCWaveMDup: parseFloat(d['TEBC Wave (M) - Duplicate']) || 0,

        UncuredLamMOpen: parseFloat(d['Uncured laminate (M) - Open_No_Disposition']) || 0,
        UncuredLamMOut: parseFloat(d['Uncured laminate (M) - Out_of_Tolerance']) || 0,
        UncuredLamMFsptv: parseFloat(d['Uncured laminate (M) - False_Positive']) || 0,
        UncuredLamMWnTol: parseFloat(d['Uncured laminate (M) - Within_Tolerance']) || 0,
        UncuredLamMRepair: parseFloat(d['Uncured laminate (M) - Repaired']) || 0,
        UncuredLamMDup: parseFloat(d['Uncured laminate (M) - Duplicate']) || 0,

        OtherMOpen: parseFloat(d['Other (M) - Open_No_Disposition']) || 0,
        OtherMOut: parseFloat(d['Other (M) - Out_of_Tolerance']) || 0,
        OtherMFsptv: parseFloat(d['Other (M) - False_Positive']) || 0,
        OtherMWnTol: parseFloat(d['Other (M) - Within_Tolerance']) || 0,
        OtherMRepair: parseFloat(d['Other (M) - Repaired']) || 0,
        OtherMDup: parseFloat(d['Other (M) - Duplicate']) || 0,

        blade_id: d['Blade ID'],
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

  // Aggregate the filtered data by month
  const aggregatedData = aggregateByMonth(filteredData);

  const years = [...new Set(data.map((d) => d.date.getFullYear()))];
  const factories = [...new Set(data.map((d) => d.factory_name))];
  const locations = [...new Set(data.map((d) => d.location))];
  const bladeType = [...new Set(data.map((d) => d.bladeType))];



//mapping the data to the data key
  const defectTypeDataKeys = {
    TotalDefect:{
      Open: 'TotalOpen',
      FalsePositive: 'TotalFsptv',
      Repaired: 'TotalRepair',
    },

    Delamination: {
      Open: 'DelaminationMOpen',
      Out: 'DelaminationMOut',
      FalsePositive: 'DelaminationMFsptv',
      WithinTolerance: 'DelaminationMWnTol',
      Repaired: 'DelaminationMRepair',
      Duplicate: 'DelaminationMDup',
    },
    AdhesiveV: {
      Open: 'AdhesiveVMOpen',
      Out: 'AdhesiveVMOut',
      FalsePositive: 'AdhesiveVMFsptv',
      WithinTolerance: 'AdhesiveVMWnTol',
      Repaired: 'AdhesiveVMRepair',
      Duplicate: 'AdhesiveVMDup',
    },
    CoreGap: {
      Open: 'CoreGapMOpen',
      Out: 'CoreGapMOut',
      FalsePositive: 'CoreGapMFsptv',
      WithinTolerance: 'CoreGapMWnTol',
      Repaired: 'CoreGapMRepair',
      Duplicate: 'CoreGapMDup',
    },
    DustDirt: {
      Open: 'DustDirtMOpen',
      Out: 'DustDirtMOut',
      FalsePositive: 'DustDirtMFsptv',
      WithinTolerance: 'DustDirtMWnTol',
      Repaired: 'DustDirtMRepair',
      Duplicate: 'DustDirtMDup',
    },

    AdhesiveC: {
      Open: 'AdhesiveCMOpen',
      Out: 'AdhesiveCMOut',
      FalsePositive: 'AdhesiveCMFsptv',
      WithinTolerance: 'AdhesiveCMWnTol',
      Repaired: 'AdhesiveCMRepair',
      Duplicate: 'AdhesiveCMDup',
    },

    CutsWeb: {
      Open: 'CutsWebMOpen',
      Out: 'CutsWebMOut',
      FalsePositive: 'CutsWebMFsptv',
      WithinTolerance: 'CutsWebMWnTol',
      Repaired: 'CutsWebMRepair',
      Duplicate: 'CutsWebMDup',
    },

    DamageGlass: {
      Open: 'DamagedGlassMOpen',
      Out: 'DamagedGlassMOut',
      FalsePositive: 'DamagedGlassMFsptv',
      WithinTolerance: 'DamagedGlassMWnTol',
      Repaired: 'DamagedGlassMRepair',
      Duplicate: 'DamagedGlassMDup',
    },

    EntrainedAir: {
      Open: 'EntrainedAirMOpen',
      Out: 'EntrainedAirMOut',
      FalsePositive: 'EntrainedAirMFsptv',
      WithinTolerance: 'EntrainedAirMWnTol',
      Repaired: 'EntrainedAirMRepair',
      Duplicate: 'EntrainedAirMDup',
    },

    MissingLam: {
      Open: 'MissingLamMOpen',
      Out: 'MissingLamMOut',
      FalsePositive: 'MissingLamMFsptv',
      WithinTolerance: 'MissingLamMWnTol',
      Repaired: 'MissingLamMRepair',
      Duplicate: 'MissingLamMDup',
    },

    ForeignObject: {
      Open: 'ForeignObjectMOpen',
      Out: 'ForeignObjectMOut',
      FalsePositive: 'ForeignObjectMFsptv',
      WithinTolerance: 'ForeignObjectMWnTol',
      Repaired: 'ForeignObjectMRepair',
      Duplicate: 'ForeignObjectMDup',
    },

    LamLoose: {
      Open: 'LamLooseMOpen',
      Out: 'LamLooseMOut',
      FalsePositive: 'LamLooseMFsptv',
      WithinTolerance: 'LamLooseMWnTol',
      Repaired: 'LamLooseMRepair',
      Duplicate: 'LamLooseMDup',
    },

    LayerEnd: {
      Open: 'LayerEndMOpen',
      Out: 'LayerEndMOut',
      FalsePositive: 'LayerEndMFsptv',
      WithinTolerance: 'LayerEndMWnTol',
      Repaired: 'LayerEndMRepair',
      Duplicate: 'LayerEndMDup',
    },

    LayerMis: {
      Open: 'LayerMisMOpen',
      Out: 'LayerMisMOut',
      FalsePositive: 'LayerMisMFsptv',
      WithinTolerance: 'LayerMisMWnTol',
      Repaired: 'LayerMisMRepair',
      Duplicate: 'LayerMisMDup',
    },

    LayerOverlap: {
      Open: 'LayerOverlapMOpen',
      Out: 'LayerOverlapMOut',
      FalsePositive: 'LayerOverlapMFsptv',
      WithinTolerance: 'LayerOverlapMWnTol',
      Repaired: 'LayerOverlapMRepair',
      Duplicate: 'LayerOverlapMDup',
    },

    LPSCableDamage: {
      Open: 'LPSCableDamageMOpen',
      Out: 'LPSCableDamageMOut',
      FalsePositive: 'LPSCableDamageMFsptv',
      WithinTolerance: 'LPSCableDamageMWnTol',
      Repaired: 'LPSCableDamageMRepair',
      Duplicate: 'LPSCableDamageMDup',
    },

    LayerOverlap: {
      Open: 'LayerOverlapMOpen',
      Out: 'LayerOverlapMOut',
      FalsePositive: 'LayerOverlapMFsptv',
      WithinTolerance: 'LayerOverlapMWnTol',
      Repaired: 'LayerOverlapMRepair',
      Duplicate: 'LayerOverlapMDup',
    },
    

    MainWebFoot: {
      Open: 'MainWebFootMOpen',
      Out: 'MainWebFootMOut',
      FalsePositive: 'MainWebFootMFsptv',
      WithinTolerance: 'MainWebFootMWnTol',
      Repaired: 'MainWebFootMRepair',
      Duplicate: 'MainWebFootMDup',
    },

    MetalShavings: {
      Open: 'MetalShavingsMOpen',
      Out: 'MetalShavingsMOut',
      FalsePositive: 'MetalShavingsMFsptv',
      WithinTolerance: 'MetalShavingsMWnTol',
      Repaired: 'MetalShavingsMRepair',
      Duplicate: 'MetalShavingsMDup',
    },

    RCOBracket: {
      Open: 'RCOBracketMOpen',
      Out: 'RCOBracketMOut',
      FalsePositive: 'RCOBracketMFsptv',
      WithinTolerance: 'RCOBracketMWnTol',
      Repaired: 'RCOBracketMRepair',
      Duplicate: 'RCOBracketMDup',
    },

    RCOSeal: {
      Open: 'RCOSealMOpen',
      Out: 'RCOSealMOut',
      FalsePositive: 'RCOSealMFsptv',
      WithinTolerance: 'RCOSealMWnTol',
      Repaired: 'RCOSealMRepair',
      Duplicate: 'RCOSealMDup',
    },

    IncorrectStaggering: {
      Open: 'IncorrectStaggeringMOpen',
      Out: 'IncorrectStaggeringMOut',
      FalsePositive: 'IncorrectStaggeringMFsptv',
      WithinTolerance: 'IncorrectStaggeringMWnTol',
      Repaired: 'IncorrectStaggeringMRepair',
      Duplicate: 'IncorrectStaggeringMDup',
    },

    Shearclips: {
      Open: 'ShearclipsMOpen',
      Out: 'ShearclipsMOut',
      FalsePositive: 'ShearclipsMFsptv',
      WithinTolerance: 'ShearclipsMWnTol',
      Repaired: 'ShearclipsMRepair',
      Duplicate: 'ShearclipsMDup',
    },

    WebFoot: {
      Open: 'WebFootMOpen',
      Out: 'WebFootMOut',
      FalsePositive: 'WebFootMFsptv',
      WithinTolerance: 'WebFootMWnTol',
      Repaired: 'WebFootMRepair',
      Duplicate: 'WebFootMDup',
    },
    
    TEBCOverlap: {
      Open: 'TEBCOverlapMOpen',
      Out: 'TEBCOverlapMOut',
      FalsePositive: 'TEBCOverlapMFsptv',
      WithinTolerance: 'TEBCOverlapMWnTol',
      Repaired: 'TEBCOverlapMRepair',
      Duplicate: 'TEBCOverlapMDup',
    },

    TEBCPasteThickness: {
      Open: 'TEBCPasteThicknessMOpen',
      Out: 'TEBCPasteThicknessMOut',
      FalsePositive: 'TEBCPasteThicknessMFsptv',
      WithinTolerance: 'TEBCPasteThicknessMWnTol',
      Repaired: 'TEBCPasteThicknessMRepair',
      Duplicate: 'TEBCPasteThicknessMDup',
    },

    TEBCWave: {
      Open: 'TEBCWaveMOpen',
      Out: 'TEBCWaveMOut',
      FalsePositive: 'TEBCWaveMFsptv',
      WithinTolerance: 'TEBCWaveMWnTol',
      Repaired: 'TEBCWaveMRepair',
      Duplicate: 'TEBCWaveMDup',
    },

    UncuredLam: {
      Open: 'UncuredLamMOpen',
      Out: 'UncuredLamMOut',
      FalsePositive: 'UncuredLamMFsptv',
      WithinTolerance: 'UncuredLamMWnTol',
      Repaired: 'UncuredLamMRepair',
      Duplicate: 'UncuredLamMDup',
    },

    Other: {
      Open: 'OtherMOpen',
      Out: 'OtherMOut',
      FalsePositive: 'OtherMFsptv',
      WithinTolerance: 'OtherMWnTol',
      Repaired: 'OtherMRepair',
      Duplicate: 'OtherMDup',
    },

  };

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
          <Select.Option value="DustDirt">Dust and Dirt</Select.Option>
          <Select.Option value="AdhesiveC">Adhesive Crack</Select.Option>
          <Select.Option value="CutsWeb">Cuts Web</Select.Option>
          <Select.Option value="DamageGlass">Damaged Glass</Select.Option>
          <Select.Option value="EntrainedAir">Entrained Air</Select.Option>
          <Select.Option value="MissingLam">Missing Lamination</Select.Option>
          <Select.Option value="ForeignObject">Foreign Object</Select.Option>
          <Select.Option value="LamLoose">Laminate Loose</Select.Option>
          <Select.Option value="LayerEnd">Layer End</Select.Option>
          <Select.Option value="LayerMis">Layer Misplacement</Select.Option>
          <Select.Option value="LayerOverlap">Layers Overlap</Select.Option>
          <Select.Option value="LPSCableDamage">LPS Cable Damage</Select.Option>
          <Select.Option value="MainWebFoot">Main SW Web Foot Lam</Select.Option>
          <Select.Option value="MetalShavings">Metal Shavings</Select.Option>
          <Select.Option value="RCOBracket">RCO Bracket bond</Select.Option>
          <Select.Option value="RCOSeal">RCO Seal</Select.Option>
          <Select.Option value="IncorrectStaggering">Repairs incorrect staggering</Select.Option>
          <Select.Option value="Shearclips">Shearclips missing</Select.Option>
          <Select.Option value="WebFoot">TE SW Web Foot Lam</Select.Option>
          <Select.Option value="TEBCOverlap">TEBC Overlam Overlap</Select.Option>
          <Select.Option value="TEBCPasteThickness">TEBC Paste Thickness</Select.Option>
          <Select.Option value="TEBCWave">TEBC Wave</Select.Option>
          <Select.Option value="UncuredLam">Uncured laminate</Select.Option>
          <Select.Option value="Other">Other</Select.Option>
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
