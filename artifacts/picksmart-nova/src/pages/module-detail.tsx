import { useState } from "react";
import { useGetModule } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, CheckCircle, Clock, Target, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LessonVideoPlayer } from "@/components/training/LessonVideoPlayer";
import { getLessonVideo } from "@/data/lessonVideoMap";

export default function ModuleDetailPage() {
  const [, params] = useRoute("/training/:id");
  const moduleId = params?.id || "";
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const { data: module, isLoading, isError } = useGetModule(moduleId, {
    query: { enabled: !!moduleId, queryKey: ["/api/modules", moduleId] }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !module) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Module not found</h2>
        <p className="text-muted-foreground mb-6">The training module you requested could not be loaded.</p>
        <Link href="/training">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Training
          </Button>
        </Link>
      </div>
    );
  }

  const video = getLessonVideo(moduleId);
  const hasVideo = !!video?.youtubeId;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Link href="/training" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
      </Link>

      {/* Module header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-border">
            {module.category}
          </Badge>
          <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-border capitalize">
            <Clock className="mr-1 h-3 w-3" /> {module.duration} min
          </Badge>
          <Badge className={
            module.difficulty === 'beginner' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
            module.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
            'bg-red-500/10 text-red-500 border-red-500/20'
          }>
            {module.difficulty}
          </Badge>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4 text-foreground">{module.title}</h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{module.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lessons — takes up 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PlayCircle className="h-5 w-5 text-primary" /> Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {module.lessons.map((lesson, idx) => {
                  const isExpanded = expandedLesson === lesson.id;
                  return (
                    <div key={lesson.id} className="group">
                      {/* Lesson row */}
                      <div className="p-4 flex gap-4">
                        {/* Step number */}
                        <div className="flex-shrink-0 flex items-start justify-center w-8 h-8 rounded-full bg-secondary text-muted-foreground font-bold text-sm mt-0.5">
                          {idx + 1}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base mb-1 leading-tight">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{lesson.description}</p>

                          <div className="flex items-center flex-wrap gap-3">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {lesson.duration} min
                            </span>

                            {/* Watch Video toggle */}
                            <button
                              onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600/10 border border-red-500/20 px-3 py-1.5 text-red-400 hover:bg-red-600/20 transition text-xs font-semibold"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              {isExpanded ? "Hide Video" : "Watch Video"}
                              {isExpanded
                                ? <ChevronUp className="h-3 w-3 ml-0.5" />
                                : <ChevronDown className="h-3 w-3 ml-0.5" />}
                            </button>

                            {/* Start lesson link */}
                            <Link href={`/training/lesson/${moduleId}`}>
                              <button className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-primary hover:bg-primary/20 transition text-xs font-semibold">
                                Start Lesson
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Expanded video panel — full width below the row */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <LessonVideoPlayer moduleId={moduleId} title={`${lesson.title} — Training Video`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Module-level "Watch Full Training" section */}
          {video && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PlayCircle className="h-5 w-5 text-red-500" />
                  Full Module Training Video
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {hasVideo
                    ? "Watch the complete training video for this module."
                    : "A training video will be available here. Click below to search YouTube for this topic."}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <LessonVideoPlayer moduleId={moduleId} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Objectives */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" /> Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {module.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{obj}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Common mistakes */}
          {module.commonMistakes.length > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <AlertCircle className="h-5 w-5" /> Watch out for
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {module.commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2"></span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick start */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground mb-4">
                Ready to learn? Start the full interactive lesson with NOVA guidance.
              </p>
              <Link href={`/training/lesson/${moduleId}`}>
                <Button className="w-full font-bold">
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Lesson
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
