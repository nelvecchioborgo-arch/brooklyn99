import React, { useState } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, getISOWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Heart, HeartCrack, SidebarClose, FileText } from 'lucide-react';

// Importa i componenti esistenti (adatta i percorsi al tuo progetto)
import DatePicker from '../components/shared/utils/DatePicker';
import SmartObiettivoTextarea from '../components/day/utils/SmartObiettivoTextarea';
import TaskColumn from '../components/shared/TaskColumn';
import CalendarColumn from '../components/dashboard/CalendarColumn';
import NotesSidebar from '../components/day/NotesSidebar';

export default function WeekPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Calcoli delle date (impostiamo weekStartsOn: 1 per il Lunedì)
  const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
  const sunday = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNum = getISOWeek(currentDate);
  
  // Questa è la data univoca con cui salveremo i dati settimanali nel DB (es. "2024-04-15")
  const weekAnchorDate = format(monday, 'yyyy-MM-dd');

  const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* --- COLONNA CENTRALE --- */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
        
        {/* ROW 1: HEADER e GOAL/PRIORITIES */}
        <div className="flex flex-col xl:flex-row justify-between items-start gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          
          {/* Header e Navigazione */}
          <div className="flex items-center gap-4 min-w-max">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={28} className="text-gray-600" />
            </button>
            
            <div className="relative">
              <div 
                className="flex flex-col items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <h1 className="text-2xl font-bold text-gray-800 uppercase">
                  Settimana {weekNum}
                </h1>
                <p className="text-sm font-medium text-gray-500">
                  {format(monday, 'dd/MM')} <span className="mx-1">→</span> {format(sunday, 'dd/MM')}
                </p>
              </div>

              {/* DatePicker popover modale */}
              {isDatePickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 shadow-xl bg-white rounded-lg border border-gray-200">
                  <DatePicker 
                    selected={currentDate} 
                    onChange={(date) => { setCurrentDate(date); setIsDatePickerOpen(false); }} 
                  />
                </div>
              )}
            </div>

            <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight size={28} className="text-gray-600" />
            </button>
          </div>

          {/* Obiettivi e Priorità (inviati con weekAnchorDate) */}
          <div className="flex-1 w-full flex flex-col gap-3 xl:border-l xl:border-gray-100 xl:pl-6">
             <div className="flex flex-col lg:flex-row lg:items-center gap-2">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wide min-w-[120px]">Goal of the week</span>
               <div className="flex-1">
                 <SmartObiettivoTextarea 
                   date={weekAnchorDate} 
                   type="WEEK_GOAL" 
                   placeholder="Qual è l'obiettivo principale?" 
                 />
               </div>
             </div>
             
             <div className="flex flex-col lg:flex-row lg:items-start gap-2 mt-2">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wide min-w-[120px] lg:mt-2">Top 3 Priorities</span>
               <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                 <SmartObiettivoTextarea date={weekAnchorDate} type="WEEK_PRIORITY_1" placeholder="1." />
                 <SmartObiettivoTextarea date={weekAnchorDate} type="WEEK_PRIORITY_2" placeholder="2." />
                 <SmartObiettivoTextarea date={weekAnchorDate} type="WEEK_PRIORITY_3" placeholder="3." />
               </div>
             </div>
          </div>
        </div>

        {/* ROW 2: CALENDARIO VISIONE SETTIMANALE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Visione Settimanale</h2>
          <div className="h-48 overflow-y-auto">
            {/* Impostare una viewMode="week" per mostrare solo i 7 giorni nel CalendarColumn */}
            <CalendarColumn startDate={monday} endDate={sunday} viewMode="week" />
          </div>
        </div>

        {/* ROW 3: TASKS E EVENTI POSITIVI/NEGATIVI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
          
          {/* Colonna Tasks */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">To Do Settimana</h2>
            <TaskColumn 
              startDate={monday} 
              endDate={sunday} 
              showNoDateTasks={true} 
            />
          </div>

          {/* Colonna Eventi (Gestita a metà da due box) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-green-400 p-4 flex flex-col gap-3">
              <h2 className="text-lg font-bold text-green-700 flex items-center gap-2">
                <Heart size={20} /> Eventi Positivi
              </h2>
              <WeeklyEventsList date={weekAnchorDate} entryType="WEEK_POSITIVE_EVENT" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-red-400 p-4 flex flex-col gap-3">
              <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <HeartCrack size={20} /> Eventi Negativi
              </h2>
              <WeeklyEventsList date={weekAnchorDate} entryType="WEEK_NEGATIVE_EVENT" />
            </div>
          </div>
        </div>
      </div>

      {/* --- CASSETTO NOTE --- */}
      {/* Tasto Fluttuante se il cassetto è chiuso */}
      {!isNotesOpen && (
        <button 
          onClick={() => setIsNotesOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-r-0 border-gray-200 p-3 rounded-l-xl shadow-lg hover:bg-gray-50 z-10 transition-transform"
        >
          <div className="flex flex-col items-center gap-2 text-gray-600">
             <FileText size={24} />
             <span className="text-xs font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>NOTE SETTIMANA</span>
          </div>
        </button>
      )}

      {/* Sidebar Laterale */}
      <div className={`transition-all duration-300 ease-in-out bg-white border-l border-gray-200 shadow-2xl z-20 flex flex-col ${isNotesOpen ? 'w-[400px]' : 'w-0'}`}>
        {isNotesOpen && (
          <>
            <button onClick={() => setIsNotesOpen(false)} className="absolute -left-12 top-4 bg-white p-2 border border-r-0 border-gray-200 rounded-l-lg shadow-sm">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
            <NotesSidebar startDate={monday} endDate={sunday} />
          </>
        )}
      </div>

    </div>
  );
}