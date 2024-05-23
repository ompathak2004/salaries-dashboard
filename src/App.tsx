import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Papa from 'papaparse';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Data {
  Year: number;
  TotalJobs: number;
  AverageSalary: number;
}

interface JobDetail {
  title: string;
  count: number;
}

const App: React.FC = () => {
  const [data, setData] = useState<Data[]>([]);
  const [jobDetails, setJobDetails] = useState<{ [key: number]: JobDetail[] }>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/salaries.csv');
      const reader = response.body?.getReader();
      const result = await reader?.read();
      const decoder = new TextDecoder('utf-8');
      const csv = decoder.decode(result?.value);
      const parsed = Papa.parse<any>(csv, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      const aggregatedData: { [key: number]: { totalJobs: number, totalSalary: number, jobCounts: { [title: string]: number } } } = {};

      parsed.data.forEach((row: any) => {
        const year = row.work_year;
        const salary = row.salary_in_usd;
        const jobTitle = row.job_title;

        if (!aggregatedData[year]) {
          aggregatedData[year] = { totalJobs: 0, totalSalary: 0, jobCounts: {} };
        }

        aggregatedData[year].totalJobs += 1;
        aggregatedData[year].totalSalary += salary;
        aggregatedData[year].jobCounts[jobTitle] = (aggregatedData[year].jobCounts[jobTitle] || 0) + 1;
      });

      const mainData: Data[] = [];
      const jobDetailsData: { [key: number]: JobDetail[] } = {};

      Object.keys(aggregatedData).forEach(year => {
        const yearData = aggregatedData[year];
        mainData.push({
          Year: parseInt(year, 10),
          TotalJobs: yearData.totalJobs,
          AverageSalary: Math.round(yearData.totalSalary / yearData.totalJobs),
        });

        jobDetailsData[year] = Object.keys(yearData.jobCounts).map(title => ({
          title,
          count: yearData.jobCounts[title],
        }));
      });

      setData(mainData);
      setJobDetails(jobDetailsData);
    };

    fetchData();
  }, []);

  const handleRowClick = (year: number) => {
    setSelectedYear(year);
  };

  const chartData = {
    labels: data.map(item => item.Year.toString()),
    datasets: [
      {
        label: 'Total Jobs',
        data: data.map(item => item.TotalJobs),
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  return (
    <div className="container">
      <h2>Main Table</h2>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Number of Total Jobs</th>
            <th>Average Salary in USD</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.Year} onClick={() => handleRowClick(item.Year)}>
              <td>{item.Year}</td>
              <td>{item.TotalJobs}</td>
              <td>{item.AverageSalary}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedYear !== null && (
        <div className="secondary-table">
          <h2>Job Titles in {selectedYear}</h2>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Number of Jobs</th>
              </tr>
            </thead>
            <tbody>
              {jobDetails[selectedYear]?.map(detail => (
                <tr key={detail.title}>
                  <td>{detail.title}</td>
                  <td>{detail.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Job Trends</h2>
      <div className="line-chart-container">
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default App;
