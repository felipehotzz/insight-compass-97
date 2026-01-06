import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter, PeriodFilter } from "@/components/dashboard/FilterButtons";
import { MonthlyLineChart } from "@/components/charts/MonthlyLineChart";
import { Globe, MessageCircle, Linkedin, Mail } from "lucide-react";
import { 
  emailMetrics,
  visitorsMonthlyData,
  blogPostsMonthlyData,
  whatsappMembersMonthlyData,
  postsMadeMonthlyData,
  followersMonthlyData,
  newFollowersMonthlyData,
  postsLinkedinMonthlyData,
  impressionsMonthlyData,
  commentsMonthlyData,
  reactionsMonthlyData,
  pageViewsMonthlyData,
  uniqueVisitorsMonthlyData,
} from "@/data/mockData";

const Presence = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [timePeriod, setTimePeriod] = useState<PeriodFilter>("last_3_months");

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-foreground">Growth</h1>
          <FilterButtons value={timeFilter} onChange={setTimeFilter} periodValue={timePeriod} onPeriodChange={setTimePeriod} />
        </div>

        {/* Site Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Site
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Visitantes" subtitle="Evolução mensal">
              <MonthlyLineChart 
                data={visitorsMonthlyData} 
                secondaryDataKey="conversions"
                secondaryLabel="Conversões"
                useSecondaryYAxis
                color="hsl(var(--color-presence))"
                secondaryColor="hsl(var(--color-success))"
              />
            </ChartCard>
            <ChartCard title="Blog Posts" subtitle="Evolução mensal">
              <MonthlyLineChart data={blogPostsMonthlyData} color="hsl(var(--color-presence))" />
            </ChartCard>
          </div>
        </div>

        {/* Community Building Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            Community Building
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Membros WhatsApp" subtitle="Evolução mensal">
              <MonthlyLineChart data={whatsappMembersMonthlyData} color="hsl(var(--color-community))" />
            </ChartCard>
            <ChartCard title="Posts Feitos (Equipe)" subtitle="Evolução mensal">
              <MonthlyLineChart data={postsMadeMonthlyData} color="hsl(var(--color-community))" />
            </ChartCard>
          </div>
        </div>

        {/* LinkedIn Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-muted-foreground" />
            LinkedIn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ChartCard title="Followers" subtitle="Evolução mensal">
              <MonthlyLineChart data={followersMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
            <ChartCard title="New Followers" subtitle="Evolução mensal">
              <MonthlyLineChart data={newFollowersMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
            <ChartCard title="Postagens" subtitle="Evolução mensal">
              <MonthlyLineChart data={postsLinkedinMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
            <ChartCard title="Impressões" subtitle="Evolução mensal">
              <MonthlyLineChart data={impressionsMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <ChartCard title="Comentários" subtitle="Evolução mensal">
              <MonthlyLineChart data={commentsMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
            <ChartCard title="Reações" subtitle="Evolução mensal">
              <MonthlyLineChart data={reactionsMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
            <ChartCard title="Page Views" subtitle="Evolução mensal">
              <MonthlyLineChart data={pageViewsMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
            <ChartCard title="Unique Visitors" subtitle="Evolução mensal">
              <MonthlyLineChart data={uniqueVisitorsMonthlyData} color="hsl(var(--color-linkedin))" />
            </ChartCard>
          </div>
        </div>

        {/* Email Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            E-mail
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Product Updates / Saiba Mais">
              <div className="text-center py-6">
                <p className="text-3xl font-normal text-foreground">{emailMetrics.productUpdates.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-2">Enviados</p>
              </div>
            </ChartCard>
            <ChartCard title="Newsletter">
              <div className="text-center py-6">
                <p className="text-3xl font-normal text-foreground">{emailMetrics.newsletters.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-2">Enviados</p>
              </div>
            </ChartCard>
            <ChartCard title="Convites">
              <div className="text-center py-6">
                <p className="text-3xl font-normal text-foreground">{emailMetrics.invites.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-2">Enviados</p>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Presence;