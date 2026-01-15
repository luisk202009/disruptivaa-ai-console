import { useMemo } from "react";
import GridLayout from "react-grid-layout";
import { Widget, GridSettings, DatePreset } from "@/hooks/useWidgets";
import { DashboardWidget } from "./widgets/DashboardWidget";
import { LayoutGrid } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

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
  const layout: LayoutItem[] = useMemo(
    () =>
      widgets.map((widget) => ({
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

  const handleLayoutChange = (newLayout: LayoutItem[]) => {
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
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`col-span-${i % 2 === 0 ? 6 : 3} h-48 glass rounded-xl animate-pulse`}
          />
        ))}
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] glass rounded-xl border-dashed">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <LayoutGrid size={32} className="text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Panel vacío
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Añade widgets para comenzar a visualizar tus métricas. Usa el botón "Añadir Widget" en la parte superior.
        </p>
      </div>
    );
  }

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={80}
      width={1200}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".widget-drag-handle"
      isResizable={true}
      isDraggable={true}
      compactType="vertical"
      preventCollision={false}
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
  );
};
