import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Search, Filter, Download, Eye, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { wordCloudData, STANCE_COLORS, STANCE_BG_COLORS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ViewFullTextModal from '@/components/ViewFullTextModal';

const ConsultationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [wordCloudFilter, setWordCloudFilter] = useState('All');
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const consultationId = parseInt(id || '1');
  const [consultation, setConsultation] = React.useState<any | null>(null);
  const [comments, setComments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const wordCloud = wordCloudData[consultationId] || {};

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch consultations to get bill key and metadata
        const cRes = await fetch('http://192.168.88.1:5000/api/consultations');
        const cJson = await cRes.json();
        let meta = null;
        if (cJson.ok) {
          meta = (cJson.data || []).find((c: any) => Number(c.id) === consultationId);
        }

        if (meta) {
          setConsultation(meta);
          // fetch comments for the bill key (e.g., bill_1)
          const billKey = meta.bill || `bill_${meta.id}`;
          const commentsRes = await fetch(`http://192.168.88.1:5000/api/comments/${billKey}`);
          const commentsJson = await commentsRes.json();
          const rows = commentsJson.ok ? commentsJson.data : [];

          // Map DB rows to frontend comment model
          const mapped = (rows || []).map((r: any) => ({
            id: r.comments_id || r.id || r.comment_id || r.commentsid || Math.random(),
            submitter: r.commenter_name || r.submitter || 'Anonymous',
            stakeholderType: r.stakeholder_type || r.stakeholderType || 'Individual',
            date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : (r.date || ''),
            stance: r.sentiment || r.stance || 'Neutral',
            summary: r.comment_data || r.summary || (r.comment_data ? String(r.comment_data).slice(0, 200) : ''),
            confidenceScore_based_on_ensemble_model: r.confidence_score || r.confidenceScore_based_on_ensemble_model || 0,
            originalText: r.comment_data || r.originalText || '',
            keywords: r.keywords || [],
            mlModel: r.ml_model || r.model || null,
            consultationId: consultationId
          }));

          setComments(mapped);
        } else {
          // fallback: set a minimal consultation if none returned
          setConsultation({ id: consultationId, title: 'Consultation', status: 'Draft', submissions: 0, endDate: '' });
          setComments([]);
        }
      } catch (e) {
        console.error('Error loading consultation data', e);
        setConsultation({ id: consultationId, title: 'Consultation', status: 'Draft', submissions: 0, endDate: '' });
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [consultationId]);

  const filteredComments = useMemo(() => {
    return comments
      .filter(c => filter === 'All' || c.stance === filter)
      .filter(c => {
        const submitter = (c.submitter || '').toString().toLowerCase();
        const summary = (c.summary || '').toString().toLowerCase();
        const keywords = Array.isArray(c.keywords) ? c.keywords : [];
        return (
          submitter.includes(searchTerm.toLowerCase()) ||
          summary.includes(searchTerm.toLowerCase()) ||
          keywords.some((keyword: string) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
  }, [comments, filter, searchTerm]);

  const stanceDistribution = Object.keys(STANCE_COLORS).map(stance => ({
    name: stance,
    value: comments.filter(c => c.stance === stance).length,
    color: STANCE_COLORS[stance as keyof typeof STANCE_COLORS]
  })).filter(item => item.value > 0);

  const filteredWordCloud = wordCloud[wordCloudFilter] || [];

  const avgConfidence = comments.length ? (comments.reduce((sum, c) => sum + (c.confidenceScore_based_on_ensemble_model || 0), 0) / comments.length) : 0;

  if (!consultation && loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground">Consultation not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {consultation.title}
          </h1>
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span>{consultation.submissions} submissions</span>
            <span>•</span>
            <span>Due: {consultation.endDate}</span>
            <span>•</span>
            <Badge variant={
              consultation.status === 'Analysis Complete' ? 'default' :
              consultation.status === 'In Progress' ? 'secondary' :
              'outline'
            }>
              {consultation.status}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            {consultation.description}
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="wordcloud">WordCloud</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <CardDescription>
                  Breakdown of stakeholder positions on this consultation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stanceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {stanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {stanceDistribution.map((stance) => (
                    <div key={stance.name} className="flex items-center text-sm">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: stance.color }}
                      ></span>
                      <span className="text-muted-foreground">{stance.name} ({stance.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
                <CardDescription>
                  Analysis metrics for this consultation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-card-hover rounded-lg">
                    <div className="text-2xl font-bold text-primary">{comments.length}</div>
                    <div className="text-sm text-muted-foreground">Total Comments</div>
                  </div>
                  <div className="text-center p-4 bg-card-hover rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      {comments.filter(c => c.stance === 'Positive').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Positive</div>
                  </div>
                  <div className="text-center p-4 bg-card-hover rounded-lg">
                    <div className="text-2xl font-bold text-destructive">
                      {comments.filter(c => c.stance === 'Negative').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Negative</div>
                  </div>
                  <div className="text-center p-4 bg-card-hover rounded-lg">
                    <div className="text-2xl font-bold text-warning">
                      {comments.filter(c => c.stance === 'Neutral').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Neutral</div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Average Confidence Score</div>
                      <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${avgConfidence * 20}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {avgConfidence.toFixed(1)}/5.0
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-80"
                />
              </div>
              <div className="flex items-center bg-secondary rounded-lg p-1">
                {['All', 'Positive', 'Negative', 'Neutral'].map(stance => (
                  <Button
                    key={stance}
                    variant={filter === stance ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(stance)}
                    className="text-xs"
                  >
                    {stance}
                  </Button>
                ))}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredComments.length} of {comments.length} submissions
            </span>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <Card key={comment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{comment.submitter}</h3>
                      <p className="text-sm text-muted-foreground">{comment.stakeholderType} • {comment.date} {comment.mlModel ? '• Model: ' + comment.mlModel : ''}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={cn("text-xs border", STANCE_BG_COLORS[comment.stance as keyof typeof STANCE_BG_COLORS])}>
                        {comment.stance}
                      </Badge>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-1">Score:</span>
                        <span className="text-sm font-medium">{comment.confidenceScore_based_on_ensemble_model}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-4">{comment.summary}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {comment.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedComment({
                          ...comment,
                          fullText: comment.originalText
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Full Text
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wordcloud" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Word Cloud Analysis</CardTitle>
                  <CardDescription>
                    Visual representation of key ts and topics via WordCloud
                  </CardDescription>
                </div>
                <div className="flex items-center bg-secondary rounded-lg p-1">
                  {['All', 'Positive', 'Negative', 'Neutral'].map(stance => (
                    <Button
                      key={stance}
                      variant={wordCloudFilter === stance ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setWordCloudFilter(stance)}
                      className="text-xs"
                    >
                      {stance}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px] flex items-center justify-center p-8">
                {filteredWordCloud.length > 0 ? (
                  <div className="w-full flex justify-center">
                    <img
                      src={filteredWordCloud[0].image}
                      alt={filteredWordCloud[0].alt}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg">No word cloud available for this filter.</p>
                    <p className="text-sm mt-2">Try selecting a different stance or "All".</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stakeholder Analysis</CardTitle>
                <CardDescription>
                  Breakdown by stakeholder type and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    comments.reduce((acc, comment) => {
                      acc[comment.stakeholderType] = (acc[comment.stakeholderType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(count / comments.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  Analysis of submission quality and engagement depth
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-card-hover rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {avgConfidence.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Confidence Score</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>High Confidence (4.0+)</span>
                    <span>{comments.filter(c => c.confidenceScore_based_on_ensemble_model >= 4.0).length} submissions</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Medium Confidence (3.0-3.9)</span>
                    <span>{comments.filter(c => c.confidenceScore_based_on_ensemble_model >= 3.0 && c.confidenceScore_based_on_ensemble_model < 4.0).length} submissions</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Low Confidence (&lt; 3.0)</span>
                    <span>{comments.filter(c => c.confidenceScore_based_on_ensemble_model < 3.0).length} submissions</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Most Active Stakeholder Type</div>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(
                      comments.reduce((acc, comment) => {
                        acc[comment.stakeholderType] = (acc[comment.stakeholderType] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ViewFullTextModal 
        comment={selectedComment}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedComment(null);
        }}
      />
    </div>
  );
};

export default ConsultationDetail;