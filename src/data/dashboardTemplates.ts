import { WidgetType, MetricType, GridSettings, DataSource } from "@/hooks/useWidgets";

export interface TemplateWidget {
  type: WidgetType;
  title: string;
  data_source: DataSource;
  metric: MetricType;
  grid_settings: GridSettings;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: "meta" | "google" | "tiktok";
  platform: DataSource;
  widgets: TemplateWidget[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "meta_performance",
    name: "Meta Ads Performance",
    description: "Panel completo con métricas clave de Facebook e Instagram Ads",
    icon: "meta",
    platform: "meta_ads",
    widgets: [
      {
        type: "kpi",
        title: "Gasto Total",
        data_source: "meta_ads",
        metric: "spend",
        grid_settings: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Clics Totales",
        data_source: "meta_ads",
        metric: "clicks",
        grid_settings: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Impresiones",
        data_source: "meta_ads",
        metric: "impressions",
        grid_settings: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Alcance",
        data_source: "meta_ads",
        metric: "reach",
        grid_settings: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "line",
        title: "Evolución del CTR",
        data_source: "meta_ads",
        metric: "ctr",
        grid_settings: { x: 0, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
      },
      {
        type: "bar",
        title: "Costo por Clic (CPC)",
        data_source: "meta_ads",
        metric: "cpc",
        grid_settings: { x: 6, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
      },
    ],
  },
  {
    id: "google_overview",
    name: "Google Ads Overview",
    description: "Vista general de campañas de búsqueda y display",
    icon: "google",
    platform: "google_ads",
    widgets: [
      {
        type: "kpi",
        title: "Impresiones",
        data_source: "google_ads",
        metric: "impressions",
        grid_settings: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Clics",
        data_source: "google_ads",
        metric: "clicks",
        grid_settings: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Gasto",
        data_source: "google_ads",
        metric: "spend",
        grid_settings: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "CTR",
        data_source: "google_ads",
        metric: "ctr",
        grid_settings: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "area",
        title: "Rendimiento de Campañas",
        data_source: "google_ads",
        metric: "clicks",
        grid_settings: { x: 0, y: 2, w: 8, h: 3, minW: 4, minH: 3 },
      },
      {
        type: "pie",
        title: "Distribución de Gasto",
        data_source: "google_ads",
        metric: "spend",
        grid_settings: { x: 8, y: 2, w: 4, h: 3, minW: 3, minH: 3 },
      },
    ],
  },
  {
    id: "tiktok_growth",
    name: "TikTok Ads Growth",
    description: "Métricas de crecimiento y engagement en TikTok",
    icon: "tiktok",
    platform: "manual",
    widgets: [
      {
        type: "kpi",
        title: "Visualizaciones",
        data_source: "manual",
        metric: "impressions",
        grid_settings: { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Engagement",
        data_source: "manual",
        metric: "clicks",
        grid_settings: { x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "kpi",
        title: "Costo por Resultado",
        data_source: "manual",
        metric: "cpc",
        grid_settings: { x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
      },
      {
        type: "line",
        title: "Tendencia de Visualizaciones",
        data_source: "manual",
        metric: "impressions",
        grid_settings: { x: 0, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
      },
      {
        type: "bar",
        title: "Engagement por Día",
        data_source: "manual",
        metric: "clicks",
        grid_settings: { x: 6, y: 2, w: 6, h: 3, minW: 4, minH: 3 },
      },
    ],
  },
];

export const getTemplateById = (id: string): DashboardTemplate | undefined => {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id);
};
