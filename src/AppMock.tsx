import { useMemo, useState } from "react";
import { useToast } from "./hooks/useToast";
import { Modal, type ModalValues } from "./components/Modal";
import { Toast } from "./components/Toast";
import { PageHeading } from "./components/layout/PageHeading";
import { getCreateKind } from "./app/createKind";
import { useAppDispatch } from "./app/hooks";
import { cerrarSesion } from "./services/usuarios/usuariosSlice";
import { AcademicView } from "./features/academica/AcademicView";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { PlanningView } from "./features/planificacion/PlanningView";
import { CycleView } from "./features/ciclo/CycleView";
import { RegularityView } from "./features/ciclo/RegularityView";
import { findAssignmentConflicts } from "./features/planificacion/conflicts";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { usePersistentState } from "./hooks/usePersistentState";
import {
  academicAssignments,
  academicCareers,
  academicPeriods,
  academicPlans,
  academicSubjects,
  campuses as mockCampuses,
  examTurns,
  rooms as mockRooms,
} from "./data/mocks";
import type {
  AcademicPeriod,
  Assignment,
  Career,
  ExamTurn,
  ModalKind,
  ModalTarget,
  Room,
  Screen,
  StudyPlan,
  Subject,
} from "./types/domain";

// Modo demo: toda esta pantalla sigue funcionando 100% con datos locales
// (localStorage), tal como antes de conectar el backend. Se activa solo si
// inicias sesion con el usuario demo (ver app/modoDemo.ts).
function AppMock() {
  const dispatch = useAppDispatch();
  const [screen, setScreen] = useState<Screen>("Resumen");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { message: toast, notify } = useToast();
  const [careers, setCareers] = usePersistentState<Career[]>(
    "uadenet-mock-careers",
    academicCareers,
  );
  const [plans, setPlans] = usePersistentState<StudyPlan[]>(
    "uadenet-mock-plans",
    academicPlans,
  );
  const [subjects, setSubjects] = usePersistentState<Subject[]>(
    "uadenet-mock-subjects",
    academicSubjects,
  );
  const [campusList, setCampusList] = usePersistentState(
    "uadenet-mock-v2-campuses",
    mockCampuses,
  );
  const [rooms, setRooms] = usePersistentState<Room[]>(
    "uadenet-mock-v2-rooms",
    mockRooms,
  );
  const [assignments, setAssignments] = usePersistentState<Assignment[]>(
    "uadenet-mock-v2-assignments",
    academicAssignments,
  );
  const [periods, setPeriods] = usePersistentState<AcademicPeriod[]>(
    "uadenet-mock-v2-periods",
    academicPeriods,
  );
  const [turns, setTurns] = usePersistentState<ExamTurn[]>(
    "uadenet-mock-v2-turns",
    examTurns,
  );
  const [correlatives, setCorrelatives] = usePersistentState<
    Record<number, number[]>
  >("uadenet-mock-v2-correlatives", { 1: [2, 5] });

  const academicScreens: Screen[] = [
    "Carreras",
    "Planes de estudio",
    "Asignaturas",
    "Correlatividades",
  ];
  const planningScreens: Screen[] = ["Sedes y aulas", "Cursos", "Asignaciones", "Agenda"];
  const cycleScreens: Screen[] = ["Períodos", "Turnos de examen"];
  const campuses = useMemo(
    () =>
      campusList.map((campus) => ({
        ...campus,
        roomsCount: Math.max(
          campus.roomsCount,
          rooms.filter(
            (room) => room.campus === campus.name && room.status !== "Inactiva",
          ).length,
        ),
      })),
    [campusList, rooms],
  );

  const navigate = (next: Screen) => {
    setScreen(next);
    setQuery("");
    setSidebarOpen(false);
  };

  const openCreate = (kind: ModalKind) => setModal({ kind });
  const openEdit = (kind: ModalKind, id: number) => setModal({ kind, id });

  const confirmAction = (message: string, action: () => void) => {
    if (window.confirm(message)) action();
  };

  const deactivate = (kind: ModalKind, id: number) => {
    const labels: Record<ModalKind, string> = {
      career: "la carrera",
      plan: "el plan de estudio",
      subject: "la asignatura",
      campus: "la sede",
      room: "el aula",
      assignment: "la asignación",
      period: "el período",
      exam: "el turno de examen",
    };
    if (
      kind === "career" &&
      plans.some((plan) => plan.careerId === id && plan.status !== "Inactiva")
    ) {
      notify("No se puede desactivar la carrera porque tiene planes activos.");
      return;
    }
    if (kind === "room") {
      const room = rooms.find((item) => item.id === id);
      if (
        room &&
        assignments.some(
          (assignment) =>
            assignment.room.toLowerCase() === room.name.toLowerCase(),
        )
      ) {
        notify(
          "No se puede desactivar el aula porque tiene asignaciones registradas.",
        );
        return;
      }
    }
    confirmAction(
      `¿Querés desactivar ${labels[kind]}? Podrás restaurarlo luego desde el backend.`,
      () => {
        if (kind === "career")
          setCareers((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: "Inactiva" } : item,
            ),
          );
        if (kind === "plan")
          setPlans((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: "Inactiva" } : item,
            ),
          );
        if (kind === "subject")
          setSubjects((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: "Inactiva" } : item,
            ),
          );
        if (kind === "room")
          setRooms((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: "Inactiva" } : item,
            ),
          );
        if (kind === "assignment")
          setAssignments((items) => items.filter((item) => item.id !== id));
        if (kind === "period")
          setPeriods((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: "Finalizado" } : item,
            ),
          );
        if (kind === "exam")
          setTurns((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: "Finalizado" } : item,
            ),
          );
        notify("Registro desactivado correctamente");
      },
    );
  };

  const restore = (kind: ModalKind, id: number) => {
    if (kind === "career")
      setCareers((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: "Activa" } : item,
        ),
      );
    if (kind === "plan")
      setPlans((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: "Activa" } : item,
        ),
      );
    if (kind === "subject")
      setSubjects((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: "Activa" } : item,
        ),
      );
    if (kind === "room")
      setRooms((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: "Disponible" } : item,
        ),
      );
    notify("Registro restaurado correctamente");
  };

  const initialValues = (): ModalValues => {
    if (!modal?.id) return {};
    if (modal.kind === "career") {
      const item = careers.find((career) => career.id === modal.id);
      return item
        ? {
            name: item.name,
            title: item.title,
            faculty: item.faculty,
            duration: item.duration,
            code: item.code,
          }
        : {};
    }
    if (modal.kind === "plan") {
      const item = plans.find((plan) => plan.id === modal.id);
      return item
        ? {
            name: item.name,
            career: item.career,
            validFrom: item.validFrom,
            subjectsCount: String(item.subjectsCount),
            code: item.code,
          }
        : {};
    }
    if (modal.kind === "subject") {
      const item = subjects.find((subject) => subject.id === modal.id);
      return item
        ? {
            name: item.name,
            code: item.code,
            career: item.career,
            plan: item.plan,
            year: item.year,
            credits: String(item.credits),
          }
        : {};
    }
    if (modal.kind === "room") {
      const item = rooms.find((room) => room.id === modal.id);
      return item
        ? {
            name: item.name,
            campus: item.campus,
            type: item.type,
            capacity: String(item.capacity),
          }
        : {};
    }
    if (modal.kind === "assignment") {
      const item = assignments.find((assignment) => assignment.id === modal.id);
      return item
        ? {
            course: item.course,
            room: item.room,
            day: item.day,
            start: item.start,
            end: item.end,
          }
        : {};
    }
    if (modal.kind === "period") {
      const item = periods.find((period) => period.id === modal.id);
      return item ? { name: item.name, start: item.start, end: item.end } : {};
    }
    const item = turns.find((turn) => turn.id === modal.id);
    return item ? { name: item.name, start: item.start, end: item.end } : {};
  };

  const duplicate = (
    items: { id: number; name: string; code?: string }[],
    values: ModalValues,
    id?: number,
  ) =>
    items.some(
      (item) =>
        item.id !== id &&
        (item.name.toLowerCase() === values.name.trim().toLowerCase() ||
          Boolean(
            values.code &&
            item.code?.toLowerCase() === values.code.trim().toLowerCase(),
          )),
    );

  const saveModal = (values: ModalValues) => {
    if (!modal) return;
    const id = modal.id ?? 0;
    if (modal.kind === "career") {
      if (duplicate(careers, values, modal.id))
        return "Ya existe una carrera con ese nombre o código.";
      const item: Career = {
        id: modal.id ?? nextId(careers),
        name: values.name.trim(),
        title: values.title.trim(),
        faculty: values.faculty.trim(),
        duration: `${values.duration.trim()} años`,
        code: values.code.trim().toUpperCase(),
        status: careers.find((career) => career.id === id)?.status ?? "Activa",
      };
      setCareers((items) =>
        modal.id
          ? items.map((current) => (current.id === modal.id ? item : current))
          : [...items, item],
      );
      notify(modal.id ? "Carrera actualizada" : "Carrera creada correctamente");
    }
    if (modal.kind === "plan") {
      if (duplicate(plans, values, modal.id))
        return "Ya existe un plan con ese nombre o código.";
      if (
        !careers.some(
          (career) =>
            career.name.toLowerCase() === values.career.trim().toLowerCase() &&
            career.status !== "Inactiva",
        )
      )
        return "La carrera indicada no existe o está inactiva.";
      const item: StudyPlan = {
        id: modal.id ?? nextId(plans),
        name: values.name.trim(),
        career: values.career.trim(),
        careerId: careers.find(
          (career) =>
            career.name.toLowerCase() === values.career.trim().toLowerCase(),
        )?.id,
        validFrom: values.validFrom.trim(),
        subjectsCount: Number(values.subjectsCount),
        code: values.code.trim().toUpperCase(),
        status: plans.find((plan) => plan.id === id)?.status ?? "Borrador",
      };
      setPlans((items) =>
        modal.id
          ? items.map((current) => (current.id === modal.id ? item : current))
          : [...items, item],
      );
      notify(modal.id ? "Plan actualizado" : "Plan creado correctamente");
    }
    if (modal.kind === "subject") {
      if (duplicate(subjects, values, modal.id))
        return "Ya existe una asignatura con ese nombre o código.";
      if (
        !careers.some(
          (career) =>
            career.name.toLowerCase() === values.career.trim().toLowerCase() &&
            career.status !== "Inactiva",
        )
      )
        return "La carrera indicada no existe o está inactiva.";
      if (
        !plans.some(
          (plan) =>
            plan.name.toLowerCase() === values.plan.trim().toLowerCase() &&
            plan.status !== "Inactiva",
        )
      )
        return "El plan indicado no existe o está inactivo.";
      const item: Subject = {
        id: modal.id ?? nextId(subjects),
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        career: values.career.trim(),
        plan: values.plan.trim(),
        year: values.year.trim(),
        credits: Number(values.credits),
        status:
          subjects.find((subject) => subject.id === id)?.status ?? "Activa",
      };
      setSubjects((items) =>
        modal.id
          ? items.map((current) => (current.id === modal.id ? item : current))
          : [...items, item],
      );
      notify(
        modal.id ? "Asignatura actualizada" : "Asignatura creada correctamente",
      );
    }
    if (modal.kind === "campus") {
      if (
        campusList.some(
          (campus) =>
            campus.name.toLowerCase() === values.name.trim().toLowerCase(),
        )
      )
        return "Ya existe una sede con ese nombre.";
      setCampusList((items) => [
        ...items,
        { id: nextId(items), name: values.name.trim(), roomsCount: 0 },
      ]);
      notify("Sede creada correctamente");
    }
    if (modal.kind === "room") {
      if (
        rooms.some(
          (room) =>
            room.id !== modal.id &&
            room.name.toLowerCase() === values.name.trim().toLowerCase() &&
            room.campus.toLowerCase() === values.campus.trim().toLowerCase(),
        )
      )
        return "Ya existe un aula con ese nombre en esa sede.";
      if (
        !campusList.some(
          (campus) =>
            campus.name.toLowerCase() === values.campus.trim().toLowerCase(),
        )
      )
        return "La sede indicada no existe. Creala antes de agregar el aula.";
      const item: Room = {
        id: modal.id ?? nextId(rooms),
        name: values.name.trim(),
        campus: values.campus.trim(),
        type: values.type.trim(),
        capacity: Number(values.capacity),
        status: rooms.find((room) => room.id === id)?.status ?? "Disponible",
      };
      setRooms((items) =>
        modal.id
          ? items.map((current) => (current.id === modal.id ? item : current))
          : [...items, item],
      );
      notify(modal.id ? "Aula actualizada" : "Aula creada correctamente");
    }
    if (modal.kind === "assignment") {
      if (
        !subjects.some(
          (subject) =>
            subject.name.toLowerCase() === values.course.trim().toLowerCase() &&
            subject.status !== "Inactiva",
        )
      )
        return "La asignatura indicada no existe o está inactiva.";
      const selectedRoom = rooms.find(
        (room) => room.name.toLowerCase() === values.room.trim().toLowerCase(),
      );
      if (!selectedRoom || selectedRoom.status === "Inactiva")
        return "El aula indicada no existe o está inactiva.";
      const item: Assignment = {
        id: modal.id ?? nextId(assignments),
        course: values.course.trim(),
        room: values.room.trim(),
        day: values.day.trim(),
        start: values.start,
        end: values.end,
        period: "2.º cuatrimestre 2026",
      };
      const otherAssignments = assignments.filter(
        (assignment) => assignment.id !== modal.id,
      );
      if (findAssignmentConflicts([...otherAssignments, item]).length)
        return "El aula ya está ocupada en esa franja horaria. Elegí otro horario o aula.";
      setAssignments((items) =>
        modal.id
          ? items.map((current) => (current.id === modal.id ? item : current))
          : [...items, item],
      );
      notify(
        modal.id ? "Asignación actualizada" : "Asignación creada correctamente",
      );
    }
    if (modal.kind === "period") {
      if (duplicate(periods, values, modal.id))
        return "Ya existe un período con ese nombre.";
      if (
        periods.some(
          (period) =>
            period.id !== modal.id &&
            rangesOverlap(values.start, values.end, period.start, period.end),
        )
      )
        return "Las fechas se superponen con otro período académico.";
      const item: AcademicPeriod = {
        id: modal.id ?? nextId(periods),
        name: values.name.trim(),
        start: values.start,
        end: values.end,
        status:
          periods.find((period) => period.id === id)?.status ?? "Planificado",
      };
      setPeriods((items) =>
        modal.id
          ? items.map((current) => (current.id === modal.id ? item : current))
          : [...items, item],
      );
      notify(modal.id ? "Período actualizado" : "Período creado correctamente");
    }
    if (modal.kind === "exam") {
      if (duplicate(turns, values, modal.id))
        return "Ya existe un turno con ese nombre.";
      if (
        turns.some(
          (turn) =>
            turn.id !== modal.id &&
            rangesOverlap(values.start, values.end, turn.start, turn.end),
        )
      )
        return "Las fechas se superponen con otro turno de examen.";
      const item: ExamTurn = {
        id: modal.id ?? nextId(turns),
        name: values.name.trim(),
        start: values.start,
        end: values.end,
        exams: 0,
        status: turns.find((turn) => turn.id === id)?.status ?? "Planificado",
      };
      setTurns((items) =>
        modal.id
          ? items.map((current) =>
              current.id === modal.id
                ? { ...item, exams: current.exams }
                : current,
            )
          : [...items, item],
      );
      notify(modal.id ? "Turno actualizado" : "Turno creado correctamente");
    }
  };

  const createKind =
    screen === "Regularidad" ? undefined : getCreateKind(screen);
  return (
    <>
      <DashboardLayout
        screen={screen}
        sidebarOpen={sidebarOpen}
        navigate={navigate}
        closeSidebar={() => setSidebarOpen(false)}
        openSidebar={() => setSidebarOpen(true)}
        perfilNombre="Usuario demo"
        perfilSubtitulo="Modo mock"
        onLogout={() => dispatch(cerrarSesion())}
      >
        <PageHeading
          screen={screen}
          onCreate={createKind ? () => openCreate(createKind) : undefined}
        />
        {screen === "Resumen" && (
          <DashboardPage
            onNavigate={navigate}
            onCreate={() => openCreate("career")}
            careerCount={
              careers.filter((career) => career.status !== "Inactiva").length
            }
            subjectCount={
              subjects.filter((subject) => subject.status !== "Inactiva").length
            }
            roomCount={
              rooms.filter((room) => room.status !== "Inactiva").length
            }
          />
        )}
        {academicScreens.includes(screen) && (
          <AcademicView
            screen={screen}
            query={query}
            setQuery={setQuery}
            onCreate={() => openCreate(getCreateKind(screen))}
            onEdit={(id) => openEdit(getCreateKind(screen), id)}
            onDeactivate={(id) => deactivate(getCreateKind(screen), id)}
            onRestore={(id) => restore(getCreateKind(screen), id)}
            onNotify={notify}
            careers={careers}
            plans={plans}
            subjects={subjects}
            correlatives={correlatives}
            onAddCorrelative={(subjectId, prerequisiteId) => {
              setCorrelatives((current) => ({
                ...current,
                [subjectId]: [...(current[subjectId] ?? []), prerequisiteId],
              }));
              notify("Correlativa agregada");
            }}
            onRemoveCorrelative={(subjectId, prerequisiteId) => {
              setCorrelatives((current) => ({
                ...current,
                [subjectId]: (current[subjectId] ?? []).filter(
                  (id) => id !== prerequisiteId,
                ),
              }));
              notify("Correlativa quitada");
            }}
          />
        )}
        {planningScreens.includes(screen) && (
          <PlanningView
            screen={screen}
            query={query}
            setQuery={setQuery}
            onCreate={() => openCreate(getCreateKind(screen))}
            onCreateCampus={() => openCreate("campus")}
            onNotify={notify}
            rooms={rooms}
            campuses={campuses}
            assignments={assignments}
            onEditRoom={(id) => openEdit("room", id)}
            onDeactivateRoom={(id) => deactivate("room", id)}
            onRestoreRoom={(id) => restore("room", id)}
            onEditAssignment={(id) => openEdit("assignment", id)}
            onDeactivateAssignment={(id) => deactivate("assignment", id)}
          />
        )}
        {cycleScreens.includes(screen) && (
          <CycleView
            screen={screen}
            query={query}
            setQuery={setQuery}
            onCreate={() => openCreate(getCreateKind(screen))}
            onNotify={notify}
            periods={periods}
            turns={turns}
            onEdit={(id) => openEdit(getCreateKind(screen), id)}
            onDeactivate={(id) => deactivate(getCreateKind(screen), id)}
          />
        )}
        {screen === "Regularidad" && <RegularityView onNotify={notify} />}
      </DashboardLayout>
      {toast && <Toast message={toast} />}
      {modal && (
        <Modal
          target={modal}
          initialValues={initialValues()}
          close={() => setModal(null)}
          onSave={saveModal}
          catalogs={{ careers, plans, subjects, campuses: campusList, rooms }}
        />
      )}
    </>
  );
}

function nextId(items: { id: number }[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

function rangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export default AppMock;
