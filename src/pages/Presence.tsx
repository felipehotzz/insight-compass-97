import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FilterButtons, TimeFilter } from "@/components/dashboard/FilterButtons";
import {
  Globe,
  BookOpen,
  MessageCircle,
  Linkedin,
  Mail,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Send,
} from "lucide-react";
import { linkedinMetrics, siteMetrics, communityMetrics, emailMetrics } from "@/data/mockData";

const Presence = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  return (
    <DashboardLayout title="Presença & Mídias">
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex justify-end">
          <FilterButtons value={timeFilter} onChange={setTimeFilter} />
        </div>

        {/* Site Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Site
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Visitantes"
              value={siteMetrics.visitors.toLocaleString("pt-BR")}
              trend={{ value: 18 }}
              icon={<Eye className="h-5 w-5" />}
            />
            <StatCard
              title="Blog Posts"
              value={siteMetrics.blogPosts}
              icon={<BookOpen className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Community Building Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Community Building
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Membros WhatsApp"
              value={communityMetrics.whatsappMembers}
              trend={{ value: 5 }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Posts Feitos (Equipe)"
              value={communityMetrics.postsMade}
              icon={<MessageSquare className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* LinkedIn Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-primary" />
            LinkedIn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Followers"
              value={linkedinMetrics.followers.toLocaleString("pt-BR")}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="New Followers"
              value={`+${linkedinMetrics.newFollowers}`}
              trend={{ value: 8 }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Postagens"
              value={linkedinMetrics.posts}
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <StatCard
              title="Impressões"
              value={linkedinMetrics.impressions.toLocaleString("pt-BR")}
              trend={{ value: 22 }}
              icon={<Eye className="h-5 w-5" />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <StatCard
              title="Comentários"
              value={linkedinMetrics.comments}
              icon={<MessageCircle className="h-5 w-5" />}
            />
            <StatCard
              title="Reações"
              value={linkedinMetrics.reactions.toLocaleString("pt-BR")}
              icon={<Heart className="h-5 w-5" />}
            />
            <StatCard
              title="Page Views"
              value={linkedinMetrics.pageViews.toLocaleString("pt-BR")}
              icon={<Eye className="h-5 w-5" />}
            />
            <StatCard
              title="Unique Visitors"
              value={linkedinMetrics.uniqueVisitors.toLocaleString("pt-BR")}
              icon={<Users className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Email Section */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            E-mail
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Product Updates / Saiba Mais">
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-foreground">{emailMetrics.productUpdates.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-2">Enviados</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <span className="text-sm text-success">+12% vs período anterior</span>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Newsletter">
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-foreground">{emailMetrics.newsletters.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-2">Enviados</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <span className="text-sm text-success">+8% vs período anterior</span>
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Convites">
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-foreground">{emailMetrics.invites.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-muted-foreground mt-2">Enviados</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <span className="text-sm text-success">+25% vs período anterior</span>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Presence;
