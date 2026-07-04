// src/components/dashboard/calendar/WeekGrid.tsx
import React from 'react';
import type { CalendarState } from '@/hooks/useCalendarState';
import type { CalendarEvent, Task } from '@/types';
import WeeklyFocusPopup from '@/components/dashboard/WeeklyFocusPopup';
import { pad } from '@/utils/dateUtils';
import { getEventSegmentsForDay, type DayEventItem } from '@/utils/eventUtils';
import { getHexColor, getDynamicStyles } from '@/utils/uiUtils';

interface WeekGridProps {
  state: CalendarState;
  events: CalendarEvent[];
  tasks?: Task[];
  onDayClick?: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  variant?: 'classic' | 'detailed';
}

const WeekGrid: React.FC<WeekGridProps> = ({ state, events, tasks = [], onDayClick, onSelectEvent, variant = 'classic' }) => {
  const { hoveredDay, setHoveredDay, popupRect, setPopupRect, todayStr, daysOfWeekData, hours24, setIsSelectingDate } = state;

  const gridLayoutClass = variant === 'detailed' 
    ? 'grid-cols-[50px_repeat(7,_1fr)]' 
    : 'grid-cols-8';

  return (
    <div className={`flex-1 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
      <div className="flex-1 flex flex-col bg-white relative">
        
        {/* HEADER GIORNI */}
        <div className={`sticky top-0 z-40 grid ${gridLayoutClass} gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0`}>
          <div className="bg-gray-50 py-1.5 px-1 text-gray-400 flex items-center justify-center">Ora</div>
          {daysOfWeekData.map((day, i) => {
            const isToday = day.dateStr === todayStr;
            const isDetailed = variant === 'detailed';
            
            return (
              <div 
                key={i} 
                onClick={() => onDayClick && onDayClick(day.dateStr)} 
                // CONDIZIONIAMO LE CLASSI IN BASE ALLA VARIANTE
                className={`bg-gray-50 px-1 border-l border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors
                  ${isDetailed ? 'flex-row py-1.5 gap-1.5' : 'flex-col p-2'} 
                  ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20 hover:bg-amber-100' : ''}`}
              >
                <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>
                  {day.nameShort}
                </span>
                
                {/* CONDIZIONIAMO ANCHE LA DATA IN LINEA O A CAPO */}
                <span className={`
                  ${isDetailed ? 'text-[10px] mt-0' : 'text-[9px] mt-0.5'} 
                  ${isToday 
                    ? `bg-amber-500 text-white shadow-sm font-bold ${isDetailed ? 'px-1.5 py-0.5 rounded' : 'px-2 py-0.5 rounded-full'}` 
                    : 'text-gray-400'
                  }
                `}>
                  {pad(day.dayNum)}/{pad(day.monthNum)}
                </span>
              </div>
            );
          })}
        </div>

        {/* CORPO DELLA GRIGLIA */}
        <div className={`grid ${gridLayoutClass} gap-px bg-gray-100 relative flex-1`}>
          
          {/* COLONNA DELLE ORE */}
          <div className="bg-white flex flex-col relative">
            {hours24.map((hour, i) => {
              const isMultipleOf6 = i % 6 === 0;
              return (
                <div key={i} className="flex-1 border-b border-gray-100 flex items-center justify-center min-h-0 shrink-0">
                  {isMultipleOf6 && <span className="text-[9px] font-bold text-gray-400 leading-none">{hour.split(':')[0]}</span>}
                </div>
              );
            })}
            <div className="flex-1 flex items-center justify-center min-h-0 shrink-0 border-t border-transparent">
               <span className="text-[9px] font-bold text-gray-400 leading-none bg-white px-1">24</span>
            </div>
          </div>

          {/* COLONNE DEI GIORNI */}
          {daysOfWeekData.map((day, dIdx) => {
            // 1. Calcolo tutti gli eventi grezzi del giorno
            const rawDayEvents = events.reduce((acc, ev) => {
              const seg = getEventSegmentsForDay(ev, day.dateStr);
              if (seg) acc.push({ ev, seg });
              return acc;
            }, [] as DayEventItem[]);

            // 2. Filtro le Task del giorno
            const dayTasks = tasks.filter(t => {
              const taskDate = t.data_scadenza?.substring(0, 10);
              return taskDate === day.dateStr;
            });

            // 3. LOGICA DI RAGGRUPPAMENTO (Solo per la vista Detailed)
            const multiDayEvents = rawDayEvents.filter(e => e.ev.tutto_il_giorno || (!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr));
            const timedEvents = rawDayEvents.filter(e => !e.ev.tutto_il_giorno && !(!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr));
            
            // Creiamo i "cluster" di eventi che iniziano alla stessa ora
            const groupedEvents: { top: string, height: string, events: DayEventItem[] }[] = [];
            timedEvents.forEach(item => {
               // Raggruppiamo gli eventi se la loro posizione 'top' differisce di meno del 2%
               const existingGroup = groupedEvents.find(g => Math.abs(parseFloat(g.top) - parseFloat(item.seg.top)) < 2);
               if (existingGroup) {
                   existingGroup.events.push(item);
                   // Adattiamo l'altezza del gruppo all'evento più lungo tra quelli sovrapposti
                   if (parseFloat(item.seg.height) > parseFloat(existingGroup.height)) {
                       existingGroup.height = item.seg.height;
                   }
               } else {
                   groupedEvents.push({ top: item.seg.top, height: item.seg.height, events: [item] });
               }
            });

            return (
              <div 
                key={dIdx} 
                onMouseEnter={(e) => { 
                  setIsSelectingDate(false); 
                  setHoveredDay(day.dateStr);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPopupRect({ left: rect.left, width: rect.width });
                }}
                onMouseLeave={() => { setHoveredDay(null); setPopupRect(null); }}
                className="bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair"
              >
                {hoveredDay === day.dateStr && popupRect && rawDayEvents.length > 0 && variant === 'classic' && (
                   <WeeklyFocusPopup 
                      dayNameShort={day.nameShort} dayNum={day.dayNum} monthNum={day.monthNum}
                      rawDayEvents={rawDayEvents} popupRect={popupRect}
                      onSelectEvent={onSelectEvent} closePopup={() => setHoveredDay(null)}
                   />
                )}

                {/* Righe orizzontali delle ore */}
                {hours24.map((_, i) => (
                  <div key={i} className="flex-1 border-b border-gray-50 min-h-0 shrink-0"></div>
                ))}
                <div className="flex-1 min-h-0 shrink-0 border-transparent"></div>

                {/* RENDERING EVENTI IN BASE ALLA VARIANTE */}
                {variant === 'classic' ? (
                  // --- VISUALIZZAZIONE CLASSICA (PUNTINI HOMEPAGE) ---
                  rawDayEvents.map(({ ev, seg }, idx) => {
                    const isMultiDay = ev.tutto_il_giorno || (!!ev.endDateStr && ev.endDateStr !== ev.dateStr);
                    const hex = getHexColor(ev.categoryColor);
                    
                    let overlapIdx = 0;
                    let totalOverlap = 0;
                    if (!isMultiDay) {
                      for (let i = 0; i < rawDayEvents.length; i++) {
                        const a = rawDayEvents[i];
                        const aIsMultiDay = a.ev.tutto_il_giorno || (!!a.ev.endDateStr && a.ev.endDateStr !== a.ev.dateStr);
                        if (!aIsMultiDay && Math.abs(parseFloat(a.seg.top) - parseFloat(seg.top)) < 2) {
                            totalOverlap++;
                            if (i < idx) overlapIdx++;
                        }
                      }
                    }
                    const offset = totalOverlap > 1 ? (overlapIdx - (totalOverlap - 1) / 2) * 10 : 0;
                    const isStartDay = ev.dateStr === day.dateStr;
                    const showDot = !isMultiDay || isStartDay;
                    
                    return (
                      <React.Fragment key={`${ev.id}-${day.dateStr}-${idx}`}>
                        {isMultiDay && (
                          <div 
                            className="absolute w-[80%] left-[10%] rounded-md pointer-events-none" 
                            style={{ top: seg.top, height: seg.height, backgroundColor: getDynamicStyles(hex).bg, zIndex: 5 }}
                          />
                        )}
                        {showDot && (
                          <div 
                            className={`absolute w-2 h-2 rounded-full shadow-sm`} 
                            style={{ backgroundColor: hex, top: seg.top, marginTop: '0.4rem', left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)', zIndex: 10 + overlapIdx }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  // --- VISUALIZZAZIONE DETTAGLIATA (WEEKPAGE) ---
                  <>
                    {/* 1. EVENTI TUTTO IL GIORNO - Fissati in alto per non coprire il calendario */}
                    <div className="absolute top-1 left-[2%] w-[96%] flex flex-col gap-1 z-30 pointer-events-auto">
                      {multiDayEvents.map(({ev}) => {
                        const hex = getHexColor(ev.categoryColor);
                        return (
                          <div 
                            key={`allday-${ev.id}`}
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                            className="w-full rounded px-1.5 py-1 text-[9px] sm:text-[10px] font-bold shadow-sm border-l-[3px] cursor-pointer truncate hover:whitespace-normal hover:h-auto hover:relative hover:z-50 hover:shadow-md transition-all"
                            style={{
                              backgroundColor: getDynamicStyles(hex).bg,
                              borderColor: hex,
                              color: getDynamicStyles(hex).text || '#1f2937',
                            }}
                          >
                            ★ {ev.title || 'Senza Titolo'}
                          </div>
                        );
                      })}
                    </div>

                    {/* 2. EVENTI ORARI - Singoli o Raggruppati in nuvolette */}
                    {groupedEvents.map((group, gIdx) => {
                      const items = group.events;
                      const isSingle = items.length === 1;

                      if (isSingle) {
                        // RENDER EVENTO SINGOLO
                        const { ev, seg } = items[0];
                        const hex = getHexColor(ev.categoryColor);
                        return (
                          <div 
                            key={`single-${ev.id}`}
                            className="absolute w-[96%] left-[2%] group hover:!z-50 pointer-events-auto"
                            style={{ top: seg.top, height: seg.height, zIndex: 10 }}
                          >
                            <div 
                              onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                              className="relative w-full h-full min-h-[22px] rounded p-1 text-[10px] sm:text-[11px] font-medium leading-tight shadow-sm border-l-[3px] cursor-pointer transition-all duration-200 overflow-hidden group-hover:overflow-visible group-hover:h-auto group-hover:shadow-xl bg-white"
                              style={{ 
                                backgroundColor: getDynamicStyles(hex).bg,
                                borderColor: hex,
                                color: getDynamicStyles(hex).text || '#1f2937',
                              }}
                            >
                              <div className="line-clamp-2 group-hover:line-clamp-none font-bold break-words">
                                {ev.title || 'Senza Titolo'}
                              </div>
                              <div className="hidden group-hover:block mt-1 pt-1 border-t border-black/10 text-[9px] opacity-80 font-bold tracking-wide">
                                {ev.time || 'N/D'} - {ev.endTime || 'N/D'}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // RENDER EVENTO MULTIPLO (CLUSTER / NUVOLETTA)
                        return (
                          <div 
                            key={`cluster-${gIdx}`}
                            className="absolute w-[96%] left-[2%] group hover:!z-50 pointer-events-auto"
                            style={{ top: group.top, height: group.height, zIndex: 10 }}
                          >
                            {/* NUVOLETTA CHIUSA (Scompare in hover) */}
                            <div className="absolute inset-0 w-full h-full min-h-[24px] rounded-md bg-gray-100/90 border border-gray-300 shadow-sm flex items-center justify-center cursor-pointer group-hover:opacity-0 transition-opacity duration-200 overflow-hidden">
                                <div className="bg-white px-2 py-0.5 rounded-full shadow-sm text-[10px] font-bold text-gray-600 border border-gray-200">
                                    {items.length} Eventi
                                </div>
                            </div>

                            {/* LISTA ESPANSA (Visibile solo in Hover) */}
                            <div className="absolute top-0 left-0 w-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 flex flex-col gap-1 bg-white p-1.5 rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                                <div className="text-[9px] font-bold text-gray-400 uppercase text-center pb-1 border-b border-gray-100 mb-1">
                                    Eventi Sovrapposti
                                </div>
                                {items.map(({ev}) => {
                                    const hex = getHexColor(ev.categoryColor);
                                    return (
                                        <div 
                                            key={`in-cluster-${ev.id}`}
                                            onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                                            className="w-full rounded p-1 text-[10px] sm:text-[11px] font-medium leading-tight border-l-[3px] cursor-pointer shadow-sm hover:brightness-95 shrink-0 bg-gray-50 hover:scale-[1.02] transition-transform"
                                            style={{ borderColor: hex }}
                                        >
                                            <div className="font-bold break-words" style={{ color: getDynamicStyles(hex).text || '#1f2937' }}>
                                              {ev.title || 'Senza Titolo'}
                                            </div>
                                            <div className="mt-0.5 text-[9px] text-gray-500 font-bold tracking-wide">
                                                {ev.time || 'N/D'} - {ev.endTime || 'N/D'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </>
                )}

                {/* RENDERING DELLE TASK IN SCADENZA */}
                {variant === 'detailed' && dayTasks.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-1 z-20 max-h-[30%] overflow-y-auto custom-scrollbar pointer-events-auto">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`text-[9px] sm:text-[10px] rounded px-1.5 py-0.5 truncate border-l-[3px] shadow-sm flex items-center gap-1 cursor-pointer transition-transform hover:scale-[1.02] ${
                          task.fatto 
                            ? 'bg-gray-100 text-gray-500 border-gray-400 line-through opacity-70' 
                            : 'bg-white text-gray-800 border-blue-500 font-medium'
                        }`}
                      >
                        <span className="shrink-0">{task.fatto ? '✓' : '•'}</span>
                        <span className="truncate">{task.titolo || 'Senza Titolo'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekGrid;