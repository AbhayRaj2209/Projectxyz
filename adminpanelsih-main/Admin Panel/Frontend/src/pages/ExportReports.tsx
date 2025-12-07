import React, { useState } from 'react';
import { Download, FileText, BarChart3, Users, Calendar, Printer, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

const ExportReports = () => {
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [progressStates, setProgressStates] = useState<{[key: string]: number}>({});

  const reportTypes = [
    {
      title: 'Consultation Report',
      description: 'Comprehensive analysis report for selected consultation',
      icon: FileText,
      format: ['PDF', 'DOCX']
    },
    {
      title: 'Trend Analysis',
      description: 'Historical trend analysis across all consultations',
      icon: BarChart3,
      format: ['PDF', 'Excel']
    },
    {
      title: 'Stakeholder Report',
      description: 'Detailed stakeholder engagement analysis',
      icon: Users,
      format: ['PDF', 'CSV']
    },
    {
      title: 'Raw Data Export',
      description: 'Export raw submission data for external analysis',
      icon: Calendar,
      format: ['CSV', 'JSON']
    }
  ];

  const recentReports = [
    {
      name: 'Draft Companies (Amendment) Bill, 2025 - Analysis Report',
      type: 'Consultation Report',
      generatedAt: '2025-08-31 16:30'
    },
    {
      name: 'Insolvency & Bankruptcy Code (Second Amendment) - Analysis Report',
      type: 'Consultation Report',
      generatedAt: '2025-07-15 14:45'
    }
  ];

  const handleGenerateReport = (reportType: string) => {
    setLoadingStates(prev => ({ ...prev, [reportType]: true }));
    setProgressStates(prev => ({ ...prev, [reportType]: 0 }));
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgressStates(prev => {
        const currentProgress = prev[reportType] || 0;
        const newProgress = Math.min(currentProgress + Math.random() * 20, 100);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setLoadingStates(prev => ({ ...prev, [reportType]: false }));
          // Simulate PDF download
          const link = document.createElement('a');
          link.href = 'data:text/plain;charset=utf-8,Sample PDF Content for ' + reportType;
          link.download = `${reportType.replace(/\s+/g, '_')}_Report.pdf`;
          link.click();
        }
        
        return { ...prev, [reportType]: newProgress };
      });
    }, 200);
  };

  const handleDownload = (reportName: string) => {
    // Generate sample PDF for download
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Sample PDF Content for ' + reportName;
    link.download = `${reportName.replace(/\s+/g, '_')}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-secondary rounded-xl p-8 border">
        <h1 className="text-3xl font-bold text-foreground mb-2">Export & Reports</h1>
        <p className="text-muted-foreground text-lg">
          Generate comprehensive reports and export data from Project Saaransh
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Generate New Report
              </CardTitle>
              <CardDescription>
                Create comprehensive analysis reports in multiple formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportTypes.map((report) => (
                <div key={report.title} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {report.format.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleGenerateReport(report.title)}
                      disabled={loadingStates[report.title]}
                    >
                      {loadingStates[report.title] ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      {loadingStates[report.title] ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                  
                  {loadingStates[report.title] && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Generating report...</span>
                        <span>{Math.round(progressStates[report.title] || 0)}%</span>
                      </div>
                      <Progress value={progressStates[report.title] || 0} className="h-2" />
                    </div>
                  )}
                  
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReports.map((report, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{report.name}</h4>
                      <p className="text-xs text-muted-foreground">{report.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <div>Generated: {report.generatedAt}</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(report.name)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common export operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Under Construction</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Quick actions will be available in future updates
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-sm">
                  <p className="text-sm text-orange-800 italic">
                    "This feature is currently being developed and will be released in a future version of the platform."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;