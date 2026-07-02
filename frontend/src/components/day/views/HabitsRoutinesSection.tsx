// src/components/day/HabitsRoutinesSection.tsx
import React from 'react';
import HabitsBar, { type HabitItem } from '@/components/day/HabitsBar';
import HabitNewModal from '@/components/day/HabitNewModal';
import RoutineColumn, { type RoutineItem } from '@/components/day/RoutineColumn';
import RoutineNewModal from '@/components/day/RoutineNewModal';
import RoutineDetailModal from '@/components/day/RoutineDetailModal';
import { useModal } from '@/hooks/useModals';

interface HabitsRoutinesSectionProps {
  habits: HabitItem[];
  routines: RoutineItem[];
  updateHabitLog: (params: { habitId: number; delta: number }) => void;
  updateHabitCount: (params: { habitId: number; delta: number }) => void;
  saveHabit: (payload: any) => void;
  deleteHabit: (id: number) => void;
  suspendRoutine: (params: { habitId: number; periodId: number; endDate: string }) => void;
  resumeRoutine: (params: { habitId: number; target: number; startDate: string }) => void;
  updateHabitPeriod: (params: { habitId: number; periodId: number; target: number }) => void;
  targetDateStr: string;
}

export const HabitsRoutinesSection: React.FC<HabitsRoutinesSectionProps> = ({
  habits,
  routines,
  updateHabitLog,
  updateHabitCount,
  saveHabit,
  deleteHabit,
  suspendRoutine,
  resumeRoutine,
  updateHabitPeriod, 
  targetDateStr
}) => {
  // Tutti gli ultimi modali rimasti traslocano qui, in isolamento!
  const routineDetailModal = useModal<RoutineItem>();
  const routineFormModal = useModal<RoutineItem>();
  const habitFormModal = useModal();

  const [isResuming, setIsResuming] = React.useState(false);
  const selectedRoutine = routineDetailModal.data;

  // Ordina i periodi dal più recente al più vecchio
  const sortedPeriods = selectedRoutine?.periods
    ? [...selectedRoutine.periods].sort((a, b) => new Date(b.data_inizio).getTime() - new Date(a.data_inizio).getTime())
    : [];

  // Consideriamo la routine ATTIVA se l'ultimo periodo (il più recente) NON HA una data_fine
  const isAttiva = sortedPeriods.length > 0 && !sortedPeriods[0].data_fine;

  const handleSuspend = () => {
    if (!selectedRoutine) return;
    
    // Per farla sparire "da oggi in poi", chiudiamo il periodo a IERI
    const ieri = new Date(targetDateStr);
    ieri.setDate(ieri.getDate() - 1);
    const endDate = ieri.toISOString().substring(0, 10);

    suspendRoutine({ habitId: selectedRoutine.id, periodId: sortedPeriods[0].id, endDate });
    routineDetailModal.close();
  };

  const handleResume = () => {
    if (!selectedRoutine) return;
    
    setIsResuming(true);
    routineDetailModal.close();
    routineFormModal.open(selectedRoutine);
  };

  return (
    <>
      {/* UI Visibile */}
      <div className="flex flex-col gap-6 h-full min-h-0">
        <HabitsBar 
          habits={habits} 
          onToggleHabit={(id) => updateHabitLog({ habitId: id, delta: 1 })} 
          onAddHabitClick={() => habitFormModal.open()} 
        />
        
        <RoutineColumn 
          routines={routines} 
          onUpdateRoutine={(id, delta) => updateHabitCount({ habitId: id, delta })} 
          onAddRoutineClick={() => routineFormModal.open(null)} 
          onSelectRoutine={(routine) => routineDetailModal.open(routine)} 
        />
      </div>

      {/* Modali Nascosti (Routine) */}
      <RoutineDetailModal 
        isOpen={routineDetailModal.isOpen} 
        onClose={routineDetailModal.close} 
        selectedRoutine={routineDetailModal.data} 
        onEditClick={() => { 
          routineFormModal.open(routineDetailModal.data); 
          routineDetailModal.close(); 
        }} 
        onDeleteClick={(id) => { 
          deleteHabit(id); 
          routineDetailModal.close(); 
        }}
        isAttiva={isAttiva}
        onSuspendClick={handleSuspend}
        onResumeClick={handleResume} 
      />
      
      <RoutineNewModal 
        isOpen={routineFormModal.isOpen} 
        onClose={() => {
          setIsResuming(false);
          routineFormModal.close();
          }} 
        routineToEdit={routineFormModal.data} 
        onSave={async (payload) => { 
          const habitId = routineFormModal.data?.id;

          if (habitId) {
            // CASO A: MODIFICA ESISTENTE
            // 1. Salviamo SOLO i dati generali (evita l'errore 422)
            await saveHabit({ 
              existingId: habitId, 
              data: { 
                titolo: payload.titolo,
                tipo: payload.tipo,
                immagine_url: payload.immagine_url,
                rrule: payload.rrule
              }
            });

            // 2. Logica per i target / periodi
            if (isResuming) {
              await resumeRoutine({
                habitId,
                target: payload.target_completamenti,
                startDate: payload.data_inizio 
              });
            } else if (routineFormModal.data?.periodId) {
              await updateHabitPeriod({
                habitId,
                periodId: routineFormModal.data.periodId,
                target: payload.target_completamenti
              });
            }
          } else {
            // CASO B: CREAZIONE DI UNA NUOVA ROUTINE
            // Il backend si aspetta i dati del periodo dentro un array "periods"
            await saveHabit({ 
              data: { 
                titolo: payload.titolo,
                tipo: payload.tipo,
                immagine_url: payload.immagine_url,
                rrule: payload.rrule,
                periods: [{
                  data_inizio: payload.data_inizio,
                  target: payload.target_completamenti
                }]
              }
            });
          }

          setIsResuming(false);
          routineFormModal.close(); 
        }} 
      />

      {/* Modali Nascosti (Abitudini) */}
      <HabitNewModal 
        isOpen={habitFormModal.isOpen} 
        onClose={habitFormModal.close} 
        onSave={(newHabit) => { 
          saveHabit({ 
            data: {
              titolo: newHabit.titolo, 
              tipo: 'H', 
              immagine_url: newHabit.immagine_url, 
              rrule: 'FREQ=DAILY;INTERVAL=1', 
              data_inizio: new Date().toISOString().substring(0, 10), 
              target_completamenti: 1 
            }
          });
          habitFormModal.close(); 
        }} 
      />
    </>
  );
};

export default HabitsRoutinesSection;