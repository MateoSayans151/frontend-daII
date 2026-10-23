import { useState } from "react";
import { useToast } from "./hooks/useToast";
import { Toast } from "./components/Toast";
import { PageHeading } from "./components/layout/PageHeading";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { cerrarSesion } from "./services/usuarios/usuariosSlice";
import { RealDashboardPage } from "./features/real/RealDashboardPage";
import { RealAcademicView } from "./features/real/RealAcademicView";
import { RealPlanningView } from "./features/real/RealPlanningView";
import { RealCycleView } from "./features/real/RealCycleView";
import { RealRegularityView } from "./features/real/RealRegularityView";
import type { Screen } from "./types/domain";

const academicScreens: Screen[] = [
  "Carreras",
  "Planes de estudio",
  "Asignaturas",
  "Correlatividades",
];
const planningScreens: Screen[] = ["Sedes y aulas", "Cursos", "Asignaciones", "Agenda"];
const cycleScreens: Screen[] = ["Períodos", "Turnos de examen"];

// Cada pantalla despacha sus propios thunks y usa identificadores reales del backend.
function AppReal() {
  const dispatch = useAppDispatch();
  const usuario = useAppSelector((state) => state.usuarios.actual);
  const [screen, setScreen] = useState<Screen>("Resumen");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { message: toast, notify } = useToast();

  const navigate = (next: Screen) => {
    setScreen(next);
    setQuery("");
    setSidebarOpen(false);
  };

  return (
    <>
      <DashboardLayout
        screen={screen}
        sidebarOpen={sidebarOpen}
        navigate={navigate}
        closeSidebar={() => setSidebarOpen(false)}
        openSidebar={() => setSidebarOpen(true)}
        perfilNombre={usuario?.nombre}
        perfilSubtitulo={usuario?.permiso}
        onLogout={() => dispatch(cerrarSesion())}
      >
        <PageHeading screen={screen} />
        {screen === "Resumen" && (
          <RealDashboardPage
            onNavigate={navigate}
            onCreate={() => navigate("Carreras")}
          />
        )}
        {academicScreens.includes(screen) && (
          <RealAcademicView
            screen={screen}
            query={query}
            setQuery={setQuery}
            onNotify={notify}
          />
        )}
        {planningScreens.includes(screen) && (
          <RealPlanningView
            screen={screen}
            query={query}
            setQuery={setQuery}
            onNotify={notify}
          />
        )}
        {cycleScreens.includes(screen) && (
          <RealCycleView
            screen={screen}
            query={query}
            setQuery={setQuery}
            onNotify={notify}
          />
        )}
        {screen === "Regularidad" && <RealRegularityView onNotify={notify} />}
      </DashboardLayout>
      {toast && <Toast message={toast} />}
    </>
  );
}

export default AppReal;
