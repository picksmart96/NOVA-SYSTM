import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          Selector Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">Top performers based on average performance and total cases picked.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard?.map((entry, index) => {
            const isTop3 = index < 3;
            const rankColor = index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-muted-foreground";
            
            return (
              <Card key={entry.userId} className={`border-border bg-card transition-colors ${index === 0 ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardContent className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                  <div className={`text-2xl font-black w-8 text-center ${rankColor}`}>
                    #{entry.rank}
                  </div>
                  
                  <div className="hidden sm:flex h-12 w-12 rounded-full bg-secondary items-center justify-center border border-border">
                    {index === 0 ? <Trophy className="h-6 w-6 text-yellow-500" /> : 
                     index === 1 ? <Medal className="h-6 w-6 text-gray-400" /> : 
                     index === 2 ? <Medal className="h-6 w-6 text-amber-600" /> : 
                     <Star className="h-5 w-5 text-muted-foreground" />}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {entry.name}
                      {isTop3 && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0 h-5">Top Performer</Badge>}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">{entry.role}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Assignments</p>
                      <p className="text-lg font-bold">{entry.totalAssignments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Total Cases</p>
                      <p className="text-lg font-bold">{entry.totalCases.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Avg Perf.</p>
                      <p className={`text-lg font-black ${entry.avgPerformance >= 100 ? 'text-primary' : entry.avgPerformance >= 90 ? 'text-green-500' : 'text-foreground'}`}>
                        {entry.avgPerformance}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}