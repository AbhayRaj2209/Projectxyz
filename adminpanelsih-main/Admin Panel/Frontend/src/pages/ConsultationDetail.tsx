import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Search, Filter, Download, Eye, ArrowLeft, Volume2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { wordCloudData, STANCE_COLORS, STANCE_BG_COLORS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ViewFullTextModal from '@/components/ViewFullTextModal';
import SentimentDistributionCard from '@/components/SentimentDistributionCard';

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
  const [isSpeaking, setIsSpeaking] = React.useState<string | null>(null);
  const [summaries, setSummaries] = React.useState<{
    overall_summary: string | null;
    positive_summary: string | null;
    negative_summary: string | null;
  }>({
    overall_summary: null,
    positive_summary: null,
    negative_summary: null
  });
  const [expandedSummaries, setExpandedSummaries] = React.useState({
    overall: false,
    positive: false,
    negative: false
  });
  const [sectionSummaries, setSectionSummaries] = React.useState<{
    section_1: string | null;
    section_2: string | null;
    section_3: string | null;
  }>({
    section_1: null,
    section_2: null,
    section_3: null
  });
  const [expandedSections, setExpandedSections] = React.useState({
    section1: false,
    section2: false,
    section3: false
  });
  const [sectionSentiments, setSectionSentiments] = React.useState<{
    positive_summary: string | null;
    negative_summary: string | null;
  }>({
    positive_summary: null,
    negative_summary: null
  });
  const [activeSectionView, setActiveSectionView] = React.useState<{
    section1: 'overall' | 'positive' | 'negative';
    section2: 'overall' | 'positive' | 'negative';
    section3: 'overall' | 'positive' | 'negative';
  }>({
    section1: 'overall',
    section2: 'overall',
    section3: 'overall'
  });
  const [sentimentDistribution, setSentimentDistribution] = React.useState<{
    Positive: number;
    Negative: number;
    Neutral: number;
  }>({
    Positive: 0,
    Negative: 0,
    Neutral: 0
  });
  
  // Use consultation ID from URL, fallback to available word cloud data
  const wordCloud = wordCloudData[consultationId] || wordCloudData[1] || {};

  // Text-to-speech function
  const speakText = (text: string, sectionId: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    if (isSpeaking === sectionId) {
      // If already speaking this section, stop it
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setIsSpeaking(null);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(null);
    };

    setIsSpeaking(sectionId);
    window.speechSynthesis.speak(utterance);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch consultations to get bill key and metadata
        const cRes = await fetch(`${import.meta.env.VITE_API_URL}/api/consultations`);
        const cJson = await cRes.json();
        let meta = null;
        if (cJson.ok) {
          meta = (cJson.data || []).find((c: any) => Number(c.id) === consultationId);
        }

        if (meta) {
          setConsultation(meta);
          // fetch comments for the bill key (e.g., bill_1)
          const billKey = meta.bill || `bill_${meta.id}`;
          const commentsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/comments/${billKey}`);
          const commentsJson = await commentsRes.json();
          const rows = commentsJson.ok ? commentsJson.data : [];

          // Fetch summaries from documents table
          const summariesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/summaries/${billKey}`);
          const summariesJson = await summariesRes.json();
          if (summariesJson.ok && summariesJson.data) {
            setSummaries(summariesJson.data);
          }

          // Fetch section-wise summaries
          const sectionsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sections/${billKey}`);
          const sectionsJson = await sectionsRes.json();
          if (sectionsJson.ok && sectionsJson.data) {
            setSectionSummaries(sectionsJson.data);
          }

          // Fetch section-wise sentiment summaries (positive/negative)
          const sectionSentimentsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/section-sentiments/${billKey}`);
          const sectionSentimentsJson = await sectionSentimentsRes.json();
          if (sectionSentimentsJson.ok && sectionSentimentsJson.data) {
            setSectionSentiments(sectionSentimentsJson.data);
          }

          // Fetch sentiment distribution from database
          const sentimentRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sentiment/${billKey}`);
          const sentimentJson = await sentimentRes.json();
          if (sentimentJson.ok && sentimentJson.data) {
            const counts = { Positive: 0, Negative: 0, Neutral: 0 };
            sentimentJson.data.forEach((row: any) => {
              const sentiment = row.sentiment?.charAt(0).toUpperCase() + row.sentiment?.slice(1).toLowerCase();
              if (sentiment === 'Positive' || sentiment === 'Negative' || sentiment === 'Neutral') {
                counts[sentiment] = parseInt(row.count) || 0;
              }
            });
            setSentimentDistribution(counts);
          }

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
            {/* <Card>
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
            </Card> */}
            <SentimentDistributionCard sentimentCounts={sentimentDistribution} avgConfidence={avgConfidence} />

            {/* Overall Sentiment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Sentiment Summary</CardTitle>
                <CardDescription>
                  Summary insights from sentiment analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="font-semibold text-primary">Overall Bill Summary</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setExpandedSummaries(prev => ({ ...prev, overall: !prev.overall }))}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSummaries.overall && "rotate-180")} />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => speakText(summaries.overall_summary || 'No summary available yet', 'overall')}
                    >
                      <Volume2 className={cn("h-4 w-4", isSpeaking === 'overall' && "text-primary animate-pulse")} />
                    </Button>
                  </div>
                  {expandedSummaries.overall && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {summaries.overall_summary || 'Coming soon - Data will be fetched from database'}
                    </p>
                  )}
                  {!expandedSummaries.overall && summaries.overall_summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {summaries.overall_summary}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="font-semibold text-success">Positive Summary</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setExpandedSummaries(prev => ({ ...prev, positive: !prev.positive }))}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSummaries.positive && "rotate-180")} />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => speakText(summaries.positive_summary || 'No positive summary available yet', 'positive')}
                    >
                      <Volume2 className={cn("h-4 w-4", isSpeaking === 'positive' && "text-success animate-pulse")} />
                    </Button>
                  </div>
                  {expandedSummaries.positive && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {summaries.positive_summary || 'Coming soon - Database insights'}
                    </p>
                  )}
                  {!expandedSummaries.positive && summaries.positive_summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {summaries.positive_summary}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="font-semibold text-destructive">Negative Summary</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setExpandedSummaries(prev => ({ ...prev, negative: !prev.negative }))}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSummaries.negative && "rotate-180")} />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => speakText(summaries.negative_summary || 'No negative summary available yet', 'negative')}
                    >
                      <Volume2 className={cn("h-4 w-4", isSpeaking === 'negative' && "text-destructive animate-pulse")} />
                    </Button>
                  </div>
                  {expandedSummaries.negative && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {summaries.negative_summary || 'Coming soon - AI-powered analysis'}
                    </p>
                  )}
                  {!expandedSummaries.negative && summaries.negative_summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {summaries.negative_summary}
                    </p>
                  )}
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
                      onError={(e) => {
                        console.error('Failed to load image:', filteredWordCloud[0].image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg">No word cloud available for this filter.</p>
                    <p className="text-sm mt-2">Try selecting a different stance or "All".</p>
                    <p className="text-xs mt-2 opacity-50">Debug: Consultation ID: {consultationId}, Filter: {wordCloudFilter}</p>
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
                  ).map(([type, count]) => {
                    const numCount = Number(count);
                    return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(numCount / comments.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{numCount}</span>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section-wise Summary</CardTitle>
                <CardDescription>
                  AI-generated summary of key themes by section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-base text-primary">Section 1</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedSections(prev => ({ ...prev, section1: !prev.section1 }))}
                      >
                        <ChevronDown className={cn("h-5 w-5 transition-transform text-primary", expandedSections.section1 && "rotate-180")} />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant={activeSectionView.section1 === 'overall' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section1: 'overall' }))}
                        className="flex-1"
                      >
                        Overall Summary
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSectionView.section1 === 'positive' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section1: 'positive' }))}
                        className={cn(
                          "flex-1",
                          activeSectionView.section1 === 'positive' 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "border-green-600 text-green-600 hover:bg-green-50"
                        )}
                      >
                        Positive
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSectionView.section1 === 'negative' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section1: 'negative' }))}
                        className={cn(
                          "flex-1",
                          activeSectionView.section1 === 'negative' 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        )}
                      >
                        Negative
                      </Button>
                    </div>

                    {expandedSections.section1 && (
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {activeSectionView.section1 === 'overall' && (sectionSummaries.section_1 || 'No summary available yet.')}
                        {activeSectionView.section1 === 'positive' && (sectionSentiments.positive_summary || 'No positive summary available yet.')}
                        {activeSectionView.section1 === 'negative' && (sectionSentiments.negative_summary || 'No negative summary available yet.')}
                      </p>
                    )}
                    {!expandedSections.section1 && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {activeSectionView.section1 === 'overall' && sectionSummaries.section_1}
                        {activeSectionView.section1 === 'positive' && sectionSentiments.positive_summary}
                        {activeSectionView.section1 === 'negative' && sectionSentiments.negative_summary}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-base text-purple-700">Section 2</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedSections(prev => ({ ...prev, section2: !prev.section2 }))}
                      >
                        <ChevronDown className={cn("h-5 w-5 transition-transform text-purple-700", expandedSections.section2 && "rotate-180")} />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant={activeSectionView.section2 === 'overall' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section2: 'overall' }))}
                        className="flex-1"
                      >
                        Overall Summary
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSectionView.section2 === 'positive' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section2: 'positive' }))}
                        className={cn(
                          "flex-1",
                          activeSectionView.section2 === 'positive' 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "border-green-600 text-green-600 hover:bg-green-50"
                        )}
                      >
                        Positive
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSectionView.section2 === 'negative' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section2: 'negative' }))}
                        className={cn(
                          "flex-1",
                          activeSectionView.section2 === 'negative' 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        )}
                      >
                        Negative
                      </Button>
                    </div>

                    {expandedSections.section2 && (
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {activeSectionView.section2 === 'overall' && (sectionSummaries.section_2 || 'No summary available yet.')}
                        {activeSectionView.section2 === 'positive' && (sectionSentiments.positive_summary || 'No positive summary available yet.')}
                        {activeSectionView.section2 === 'negative' && (sectionSentiments.negative_summary || 'No negative summary available yet.')}
                      </p>
                    )}
                    {!expandedSections.section2 && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {activeSectionView.section2 === 'overall' && sectionSummaries.section_2}
                        {activeSectionView.section2 === 'positive' && sectionSentiments.positive_summary}
                        {activeSectionView.section2 === 'negative' && sectionSentiments.negative_summary}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-base text-amber-700">Section 3</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedSections(prev => ({ ...prev, section3: !prev.section3 }))}
                      >
                        <ChevronDown className={cn("h-5 w-5 transition-transform text-amber-700", expandedSections.section3 && "rotate-180")} />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant={activeSectionView.section3 === 'overall' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section3: 'overall' }))}
                        className="flex-1"
                      >
                        Overall Summary
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSectionView.section3 === 'positive' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section3: 'positive' }))}
                        className={cn(
                          "flex-1",
                          activeSectionView.section3 === 'positive' 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "border-green-600 text-green-600 hover:bg-green-50"
                        )}
                      >
                        Positive
                      </Button>
                      <Button
                        size="sm"
                        variant={activeSectionView.section3 === 'negative' ? 'default' : 'outline'}
                        onClick={() => setActiveSectionView(prev => ({ ...prev, section3: 'negative' }))}
                        className={cn(
                          "flex-1",
                          activeSectionView.section3 === 'negative' 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        )}
                      >
                        Negative
                      </Button>
                    </div>

                    {expandedSections.section3 && (
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {activeSectionView.section3 === 'overall' && (sectionSummaries.section_3 || 'No summary available yet.')}
                        {activeSectionView.section3 === 'positive' && (sectionSentiments.positive_summary || 'No positive summary available yet.')}
                        {activeSectionView.section3 === 'negative' && (sectionSentiments.negative_summary || 'No negative summary available yet.')}
                      </p>
                    )}
                    {!expandedSections.section3 && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                        {activeSectionView.section3 === 'overall' && sectionSummaries.section_3}
                        {activeSectionView.section3 === 'positive' && sectionSentiments.positive_summary}
                        {activeSectionView.section3 === 'negative' && sectionSentiments.negative_summary}
                      </p>
                    )}
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