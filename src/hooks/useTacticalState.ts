import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  setSelectedEntity, 
  setTacticalViewMode, 
  setSimulationActive, 
  updateThreatLevel,
  setRegistrationModalOpen
} from '../store/tacticalSlice';

export const useTacticalState = () => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((state: RootState) => state.tactical);

  return {
    ...state,
    setSelectedEntity: (id: string | number | null) => dispatch(setSelectedEntity(id)),
    setTacticalViewMode: (mode: 'orbital' | 'tactical' | 'street' | 'thermal') => dispatch(setTacticalViewMode(mode)),
    setSimulationActive: (active: boolean) => dispatch(setSimulationActive(active)),
    updateThreatLevel: (level: number) => dispatch(updateThreatLevel(level)),
    setRegistrationModalOpen: (open: boolean) => dispatch(setRegistrationModalOpen(open)),
  };
};
