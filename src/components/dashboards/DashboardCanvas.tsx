import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  GridLayout, 
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem
} from "react-grid-layout";
import { Widget, GridSettings, DatePreset } from "@/hooks/useWidgets";
import { DashboardWidget } from "./widgets/DashboardWidget";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface DashboardCanvasProps {
  widgets: Widget[];
  loading: boolean;
  globalDatePreset: DatePreset;
  onLayoutChange: (layout: { id: string; grid_settings: GridSettings }[]) => void;
  onEditWidget: (widget: Widget) => void;
  onDeleteWidget: (widgetId: string) => void;
}

export const DashboardCanvas = ({
  widgets,
  loading,
  globalDatePreset,
  onLayoutChange,
  onEditWidget,
  onDeleteWidget,
}: DashboardCanvasProps) => {
  const { t } = useTranslation();
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200,
  });

  const layout: Layout = useMemo(
    () =>
      widgets.map((widget): LayoutItem => ({
        i: widget.id,
        x: widget.grid_settings.x,
        y: widget.grid_settings.y,
        w: widget.grid_settings.w,
        h: widget.grid_settings.h,
        minW: widget.grid_settings.minW || 2,
        minH: widget.grid_settings.minH || 2,
      })),
    [widgets]
  );

  const handleLayoutChange = (newLayout: Layout) => {
    const updates = newLayout.map((item) => ({
      id: item.i,
      grid_settings: {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      },
    }));
    onLayoutChange(updates);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4">
        {[3, 6, 3, 6, 4, 4, 4].map((span, i) => (
          <div key={i} className={`col-span-${span}`}>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] glass rounded-xl border-dashed border-white/[0.06]">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <LayoutGrid size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("widget.emptyCanvasTitle")}
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {t("widget.emptyCanvas")}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {mounted && (
        <GridLayout
          className="layout"
          width={width}
          layout={layout}
          gridConfig={{
            cols: 12,
            rowHeight: 80,
            margin: [16, 16],
            containerPadding: [0, 0],
            maxRows: Infinity,
          }}
          dragConfig={{
            enabled: true,
            bounded: false,
            handle: ".widget-drag-handle",
            threshold: 3,
          }}
          resizeConfig={{
            enabled: true,
            handles: ["se"],
          }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
          autoSize={true}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <DashboardWidget
                widget={widget}
                globalDatePreset={globalDatePreset}
                onEdit={() => onEditWidget(widget)}
                onDelete={() => onDeleteWidget(widget.id)}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
};
