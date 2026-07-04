// frontend/src/views/WeekPage.tsx
import React, { useState, useMemo } from 'react';
import { getMonday, getSunday, getISOWeekNumber, formatDateString } from '@/utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';

// --- IMPORT COMPONENTI ---
import { BackIcon, ForwardIcon, UndoIcon, PlusIcon } from '@/components/shared/utils/Icons';
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';
import CalendarColumn from '@/components/dashboard/CalendarColumn';
import TaskColumn from '@/components/shared/TaskColumn';
import NotesSidebar from '@/components/day/NotesSidebar';

// --- IMPORT MODALI ---
import EventDetailModal from '@/components/shared/EventDetailModal';
import EventNewModal from '@/components/shared/EventNewModal';
import TaskDetailModal from '@/components/shared/TaskDetailModal';
import TaskNewModal from '@/components/shared/TaskNewModal';

import type { Task, CalendarEvent, DailyEntry, TaskSummary, SyncWeekResponse } from '@/types';
import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 

const WeekPage: React.FC = () => {
  // 1. STATO DELLA DATA
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  
  const monday = getMonday(targetDate);
  const sunday = getSunday(targetDate);
  const weekNumber = getISOWeekNumber(targetDate);
  const isCurrentWeek = weekNumber === getISOWeekNumber(new Date()) && monday.getFullYear() === new Date().getFullYear();

  const mondayStr = formatDateString(monday);
  const sundayStr = formatDateString(sunday);

  const queryClient = useQueryClient();
 // 2. STATI DEI PANNELLI E DEI MODALI (Tipizzati Rigorosamente)
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  // Stati per la selezione di Eventi e Task
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  
  // Stati per la creazione di nuovi elementi
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [newEventDateStr, setNewEventDateStr] = useState<string | undefined>(undefined);

  // 3. IL "CERVELLO" REACT QUERY
  const { weekData, isLoading, saveWeeklyEntry, toggleTask } = useAgendaWeek(mondayStr, sundayStr);

  // --- HANDLERS NAVIGAZIONE ---
  const handlePrevWeek = () => setTargetDate(new Date(targetDate.setDate(targetDate.getDate() - 7)));
  const handleNextWeek = () => setTargetDate(new Date(targetDate.setDate(targetDate.getDate() + 7)));
  const handleResetCurrentWeek = () => setTargetDate(new Date());

  const handleToggleTask = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const taskOrigin = weekData?.tasks.find((t: Task) => t.id === id);
    if (taskOrigin) {
      toggleTask({ id, isDone: taskOrigin.fatto });
    }
  };

  // --- HANDLERS EVENTI POSITIVI/NEGATIVI ---
  const posEvents = (weekData?.eventi_positivi || []) as Array<DailyEntry & { isNew?: boolean }>;
  const negEvents = (weekData?.eventi_negativi || []) as Array<DailyEntry & { isNew?: boolean }>;

  const handleAddWeeklyEvent = (tipo: 'EP' | 'EN') => {
    const newId = Date.now(); // ID Temporaneo per React
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      const field = tipo === 'EP' ? 'eventi_positivi' : 'eventi_negativi';
      return {
        ...oldData,
        [field]: [...(oldData[field] || []), { id: newId, testo: "", data_riferimento: mondayStr, tipo, isNew: true }]
      };
    });
  };

  const handleBlurWeeklyEvent = (e: React.FocusEvent<HTMLTextAreaElement>, ev: DailyEntry & { isNew?: boolean }, tipo: 'EP' | 'EN') => {
    const text = e.target.value;
    
    // Se è nuovo ed è stato lasciato vuoto, lo eliminiamo localmente senza chiamare il backend
    if (!text.trim() && ev.isNew) {
      queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
        if (!oldData) return oldData;
        const field = tipo === 'EP' ? 'eventi_positivi' : 'eventi_negativi';
        return {
          ...oldData,
          [field]: (oldData[field] || []).filter((x: DailyEntry) => x.id !== ev.id)
        };
      });
      return;
    }

    // Altrimenti salviamo o aggiorniamo 
    saveWeeklyEntry({ id: ev.isNew ? undefined : ev.id, text, tipo, dateStr: mondayStr });
  };


  // --- ADAPTERS ---
  const filteredTasks = useMemo(() => {
    if (!weekData?.tasks) return [];
    return weekData.tasks.filter((t: Task) => {
      if (!t.data_scadenza) return true;
      const taskDate = new Date(t.data_scadenza);
      return taskDate >= monday && taskDate <= sunday;
    });
  }, [weekData?.tasks, monday, sunday]);

  const mappedTasks: TaskSummary[] = useMemo(() => {
    return filteredTasks.map((t) => ({
      id: t.id,
      title: t.titolo,
      deadline: t.data_scadenza || "",
      dateStr: t.data_start,
      done: t.fatto,
      priority: t.priorita,
      category: t.category?.name || t.category_name || 'Generico',
      categoryColor: t.category?.colore || '#9ca3af',
      description: t.descrizione || "", 
      location: t.luogo || "",
      parent_id: t.parent_id,
      data_fatto: t.data_fatto,
      hasActiveSubtasks: t.subtasks && t.subtasks.length > 0 ? t.subtasks.some(st => !st.fatto) : false
    }));
  }, [filteredTasks]);

  const mappedEvents: CalendarEvent[] = useMemo(() => {
    if (!weekData?.events) return [];
    return weekData.events.map((e) => ({
      id: `${e.id}-${e.data_inizio.substring(0, 10)}`,
      originalId: e.id,
      title: e.titolo,
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: (e.tutto_il_giorno || !e.data_fine) ? undefined : e.data_fine.substring(11, 16),
      dateStr: e.data_inizio.substring(0, 10),
      endDateStr: e.data_fine ? e.data_fine.substring(0, 10) : undefined,
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      description: e.descrizione || undefined,
      location: e.luogo || undefined,
      tutto_il_giorno: e.tutto_il_giorno,
      rrule: e.rrule || undefined
    }));
  }, [weekData?.events]);

  const mappedNotes = useMemo(() => {
    if (!weekData?.note) return [];
    return weekData.note.map((n: DailyEntry & { isNew?: boolean }) => ({ 
      id: n.id, text: n.testo, color: "bg-yellow-200 text-yellow-900", dateStr: n.data_riferimento, isNew: n.isNew 
    }));
  }, [weekData?.note]);

  // --- HANDLERS NOTE ---
  const handleAddNote = () => {
    const newId = Date.now();
    setEditingNoteId(newId);
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, note: [{ id: newId, testo: "", data_riferimento: mondayStr, tipo: 'N1', isNew: true }, ...(oldData.note || [])] };
    });
  };

  const handleAutoSaveNote = (id: number, text: string, isNew?: boolean) => {
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, note: (oldData.note || []).map((n: DailyEntry & { isNew?: boolean }) => n.id === id ? { ...n, testo: text, isNew: false } : n) };
    });
    saveWeeklyEntry({ id: isNew ? undefined : id, text: text, tipo: 'N1', dateStr: mondayStr });
  };

  const handleDeleteNote = (id: number, isNew?: boolean) => {
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, note: (oldData.note || []).filter((n: DailyEntry & { isNew?: boolean }) => n.id !== id) };
    });
    if (!isNew) saveWeeklyEntry({ id, text: "", tipo: 'N1', dateStr: mondayStr }); 
  };


  if (isLoading && !weekData) return <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">Caricamento settimana...</div>;

  return (
    <div className={`flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative pt-2`}>
      
      {/* 1. SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <div className="xl:w-1/4 flex flex-col justify-center items-center relative py-2 z-30">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Settimanale</h2>
          
          <div className="flex items-center justify-between w-[265px] xl:w-[305px] relative mx-auto z-40">
            <button onClick={handlePrevWeek} className="relative z-50 text-blue-600 hover:text-blue-800 transition-transform hover:-translate-x-1 focus:outline-none p-2 shrink-0 bg-transparent">
              <BackIcon className="w-8 h-8" />
            </button>
            <div className="flex-1 flex justify-center relative">
              <div className="text-center">
                <h1 className="text-3xl xl:text-4xl font-extrabold text-gray-900 uppercase">SET. {weekNumber}</h1>
              </div>
            </div>
            <button onClick={handleNextWeek} className="relative z-50 text-blue-600 hover:text-blue-800 transition-transform hover:translate-x-1 focus:outline-none p-2 shrink-0 bg-transparent">
              <ForwardIcon className="w-8 h-8" />
            </button>
          </div>
          
          <p className="text-lg xl:text-xl font-medium text-gray-500 mt-1">
            {monday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})} - {sunday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})}
          </p>

          <div className="h-8 mt-2 flex items-center justify-center w-full">
            {!isCurrentWeek && (
              <button onClick={handleResetCurrentWeek} className="p-1.5 text-black hover:bg-gray-200 hover:text-black rounded-full transition-all animate-fadeIn focus:outline-none" title="Torna alla Settimana Corrente">
                <UndoIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5 z-10`}>
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Obiettivo della Settimana</h3>
            {(() => {
              const obiettivoObj = weekData?.obiettivo_settimanale;
              return (
                <SmartObiettivoTextarea 
                  key={`ob-week-${obiettivoObj?.id || 'empty'}-${mondayStr}`}
                  initialText={obiettivoObj?.testo || ""}
                  onSave={(testo) => saveWeeklyEntry({ id: obiettivoObj?.id, text: testo, tipo: 'OS', dateStr: mondayStr })}
                />
              );
            })()}
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-[280px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">3 Priorità Settimanali</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => {
                const prioritaObj = weekData?.priorita_settimanali?.[index];
                return (
                  <li key={`pri-w-row-${index}`} className="flex items-center gap-3">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <input 
                      key={`pri-week-${index}-${prioritaObj?.id || 'empty'}-${mondayStr}`} 
                      type="text" 
                      defaultValue={prioritaObj?.testo || ""} 
                      onBlur={(e) => saveWeeklyEntry({ id: prioritaObj?.id, text: e.target.value, tipo: 'PS', dateStr: mondayStr })} 
                      placeholder={`Priorità ${index + 1}`} 
                      className="w-full text-sm font-medium text-gray-700 border-none bg-transparent focus:ring-0 p-0 placeholder-gray-300" 
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 2. CALENDARIO E TASK AFFIANCATI */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-12 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 w-full min-w-0 overflow-hidden relative">
           <CalendarColumn 
             events={mappedEvents} 
             tasks={filteredTasks}
             hideHeader={true}        
             forceView="Settimana"   
             targetDate={targetDate} 
             variant="detailed"    
             onSelectEvent={(event: CalendarEvent) => setSelectedEvent(event)}
             onDayClick={(dateStr: string) => setNewEventDateStr(dateStr)}
           />
        </div>
        
        {/* <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 min-w-0">
              <TaskColumn 
                tasks={mappedTasks} 
                onToggleTask={handleToggleTask} 
                onSelectTask={(task) => console.log("Task selezionato", task)}
                onAddTaskClick={() => console.log("Aggiungi task cliccato")}
              />
        </div> */}
      </div>


      {/* 3. EVENTI POSITIVI / NEGATIVI - DUE BOLLE (Ognuna divisa in 3 colonne interne) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 shrink-0 h-44 pb-2">

        {/* --- EVENTI POSITIVI --- */}
        {/* Unica Bolla divisa in 3 (1 colonna titolo, 2 colonne textarea) */}
        <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden relative group grid grid-cols-3">
          
          {/* Titolo Positivi (1/3) */}
          <div className="col-span-1 bg-white flex flex-col items-center justify-center text-center p-2">
            <span className="text-sm xl:text-lg font-black text-green-600 uppercase tracking-widest leading-relaxed">
              EVENTI<br/>POSITIVI
            </span>
          </div>
          
          {/* Contenuto Positivi (2/3) */}
          <div className="col-span-2 p-3 overflow-y-auto custom-scrollbar relative flex flex-col bg-white">
            
            {/* Tasto Add Flottante */}
            {posEvents.length > 0 && (
              <button
                onClick={() => handleAddWeeklyEvent('EP')}
                className="absolute top-2 right-3 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-green-600 hover:border-green-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Aggiungi Evento Positivo"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}

            {posEvents.length === 0 ? (
               <div className="flex-1 flex items-center justify-center w-full h-full">
                  <button 
                    onClick={() => handleAddWeeklyEvent('EP')} 
                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 hover:scale-110 active:scale-95 transition-all flex justify-center items-center focus:outline-none"
                  >
                    <PlusIcon className="w-8 h-8" />
                  </button>
               </div>
            ) : (
               <div className={`grid gap-3 w-full h-full ${posEvents.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                 {posEvents.map((ev) => (
                    <textarea
                       key={`pos-${ev.id}-${mondayStr}`}
                       defaultValue={ev.testo || ""}
                       onBlur={(e) => handleBlurWeeklyEvent(e, ev, 'EP')}
                       placeholder="Cosa è andato bene?"
                       autoFocus={ev.isNew}
                       className="w-full h-full bg-green-50 border border-transparent rounded-lg p-3 text-sm text-green-900 resize-none focus:ring-2 focus:ring-green-300 focus:bg-white focus:border-green-300 transition-colors min-h-[80px]"
                    />
                 ))}
               </div>
            )}
          </div>
        </div>


        {/* --- EVENTI NEGATIVI --- */}
        {/* Unica Bolla divisa in 3 (1 colonna titolo, 2 colonne textarea) */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden relative group grid grid-cols-3">
          
          {/* Titolo Negativi (1/3) */}
          <div className="col-span-1 bg-white flex flex-col items-center justify-center text-center p-2">
            <span className="text-sm xl:text-lg font-black text-red-600 uppercase tracking-widest leading-relaxed">
              EVENTI<br/>NEGATIVI
            </span>
          </div>
          
          {/* Contenuto Negativi (2/3) */}
          <div className="col-span-2 p-3 overflow-y-auto custom-scrollbar relative flex flex-col bg-white">
            
            {/* Tasto Add Flottante */}
            {negEvents.length > 0 && (
              <button
                onClick={() => handleAddWeeklyEvent('EN')}
                className="absolute top-2 right-3 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-red-600 hover:border-red-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Aggiungi Evento Negativo"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}

            {negEvents.length === 0 ? (
               <div className="flex-1 flex items-center justify-center w-full h-full">
                  <button 
                    onClick={() => handleAddWeeklyEvent('EN')} 
                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95 transition-all flex justify-center items-center focus:outline-none"
                  >
                    <PlusIcon className="w-8 h-8" />
                  </button>
               </div>
            ) : (
               <div className={`grid gap-3 w-full h-full ${negEvents.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                 {negEvents.map((ev) => (
                    <textarea
                       key={`neg-${ev.id}-${mondayStr}`}
                       defaultValue={ev.testo || ""}
                       onBlur={(e) => handleBlurWeeklyEvent(e, ev, 'EN')}
                       placeholder="Cosa posso migliorare?"
                       autoFocus={ev.isNew}
                       className="w-full h-full bg-red-50 border border-transparent rounded-lg p-3 text-sm text-red-900 resize-none focus:ring-2 focus:ring-red-300 focus:bg-white focus:border-red-300 transition-colors min-h-[80px]"
                    />
                 ))}
               </div>
            )}
          </div>
        </div>

      </div>

      {/* CASSETTO NOTE NASCOSTO */}
      <NotesSidebar 
        isOpen={isNotesOpen} 
        notes={mappedNotes} 
        editingNoteId={editingNoteId}
        onOpen={() => setIsNotesOpen(true)} 
        onClose={() => setIsNotesOpen(false)}
        onAddNote={handleAddNote} 
        onAutoSaveNote={handleAutoSaveNote}
        onDeleteNote={handleDeleteNote}
        clearEditingNoteId={() => setEditingNoteId(null)}
      />

      {/* Dettaglio Evento */}
      {selectedEvent && (
        <EventDetailModal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          // CORREZIONE 1: Usiamo i nomi esatti dell'interfaccia
          selectedEvent={selectedEvent} 
          onEditClick={() => {
            console.log("Apri modale di modifica per l'evento:", selectedEvent.id);
            // Qui in futuro chiuderai questo modale e aprirai EventNewModal in modalità "modifica"
          }}
          onDeleteClick={(id) => {
            console.log("Elimina evento con ID:", id);
            // Qui in futuro chiamerai la mutation per eliminare l'evento
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Nuovo Evento / Modifica Evento */}
      {newEventDateStr && (
        <EventNewModal
          isOpen={true}
          onClose={() => setNewEventDateStr(undefined)}
          // CORREZIONE 2: Usiamo 'initialDate' come da tua interfaccia
          initialDate={newEventDateStr} 
          eventToEdit={null} // Passiamo null perché stiamo creando un evento nuovo
          onEventSaved={() => {
            console.log("Evento salvato! Ricarico i dati...");
            setNewEventDateStr(undefined);
          }}
        />
      )}

      {/* Dettaglio Task */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          
          // 1. Passiamo la task selezionata
          selectedTask={selectedTask} 
          
          // 2. Passiamo l'array completo delle task (risolve l'errore "Did you mean 'tasks'?")
          tasks={mappedTasks} 
          
          // 3. Funzione per spuntare la task (senza passare l'evento del mouse, che qui non serve)
          onToggleTask={(id: number) => {
            // Cerchiamo la task originale nei dati scaricati per sapere se era già spuntata
            const taskOrigin = weekData?.tasks.find((t: Task) => t.id === id);
            if (taskOrigin) {
              toggleTask({ id, isDone: taskOrigin.fatto });
            }
          }}
          
          // 4. Funzione per selezionare una nuova task (utilissimo se dentro 
          //    il dettaglio c'è una lista di sotto-task e l'utente ci clicca sopra)
          onSelectTask={(task: TaskSummary) => setSelectedTask(task)}
          
          // 5. Funzione obbligatoria per il tasto "Modifica"
          onEditClick={() => {
            console.log("Cliccato Modifica per la task:", selectedTask.id);
            // In futuro: chiudi questo modale e apri quello di modifica
            // setSelectedTask(null);
            // setIsNewTaskModalOpen(true);
            // e passerai i dati della task da modificare
          }}

          // 6. Funzione opzionale (ha il '?' nell'interfaccia) per le sotto-task
          onAddSubtask={(parentId: number) => {
            console.log("Aggiungi sotto-task alla task principale con ID:", parentId);
            // In futuro: apri il modale di nuova task passando il parentId
          }}
        />
      )}

      {/* Nuova Task */}
      {isNewTaskModalOpen && (
        <TaskNewModal
          isOpen={true}
          onClose={() => setIsNewTaskModalOpen(false)}
        />
      )}

    </div>
  );
};

export default WeekPage;