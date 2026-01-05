import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import { Globe, MessageCircle, Linkedin, Mail } from "lucide-react";
import { linkedinMetrics, siteMetrics, communityMetrics, emailMetrics } from "@/data/mockData";

const Presence = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Presença & Mídias</h1>
          <FilterButtons value={timeFilter} onChange={setTimeFilter} />
        </div>

        {/* Site Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Site
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Visitantes"
              value={siteMetrics.visitors.toLocaleString("pt-BR")}
              trend={{ value: 18 }}
            />
            <StatCard
              title="Blog Posts"
              value={siteMetrics.blogPosts}
            />
          </div>
        </div>

        {/* Community Building Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            Community Building
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Membros WhatsApp"
              value={communityMetrics.whatsappMembers}
              trend={{ value: 5 }}
            />
            <StatCard
              title="Posts Feitos (Equipe)"
              value={communityMetrics.postsMade}
            />
          </div>
        </div>

        {/* LinkedIn Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-muted-foreground" />
            LinkedIn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Followers"
              value={linkedinMetrics.followers.toLocaleString("pt-BR")}
            />
            <StatCard
              title="New Followers"
              value={`+${linkedinMetrics.newFollowers}`}
              trend={{ value: 8 }}
            />
            <StatCard
              title="Postagens"
              value={linkedinMetrics.posts}
            />
            <StatCard
              title="Impressões"
              value={linkedinMetrics.impressions.toLocaleString("pt-BR")}
              trend={{ value: 22 }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <StatCard
              title="Comentários"
              value={linkedinMetrics.comments}
            />
            <StatCard
              title="Reações"
              value={linkedinMetrics.reactions.toLocaleString("pt-BR")}
            />
            <StatCard
              title="Page Views"
              value={linkedinMetrics.pageViews.toLocaleString("pt-BR")}
            />
            <StatCard
              title="Unique Visitors"
              value={linkedinMetrics.uniqueVisitors.toLocaleString("pt-BR")}
            />
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
