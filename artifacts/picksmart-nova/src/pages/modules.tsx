import { useListModules } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, BookOpen, AlertTriangle } from "lucide-react";

export default function ModulesPage() {
  const { data: modules, isLoading } = useListModules();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Training Academy</h1>
          <p className="text-muted-foreground mt-1">Master warehouse operations with interactive modules.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : modules?.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No training modules found</h3>
          <p className="text-muted-foreground">Check back later for new content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules?.map((module) => (
            <Card key={module.id} className="flex flex-col overflow-hidden border-border bg-card hover:border-primary/50 transition-colors">
              <div className="aspect-video bg-secondary relative overflow-hidden flex items-center justify-center border-b border-border">
                {/* Fallback image if undefined, using gradient pattern for industrial feel */}
                <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary opacity-50" />
                <BookOpen className="h-16 w-16 text-muted-foreground relative z-10" />
                <Badge className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur border-border text-foreground">
                  {module.category}
                </Badge>
              </div>
              <CardHeader className="flex-1">
                <CardTitle className="text-xl line-clamp-1">{module.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="capitalize">{module.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{module.lessons.length} lessons</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/training/${module.id}`} className="w-full">
                  <Button className="w-full font-bold" data-testid={`btn-start-${module.id}`}>
                    Start Module
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}