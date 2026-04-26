import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TacticalState {
  selectedEntityId: string | number | null;
  tacticalViewMode: 'orbital' | 'tactical' | 'street' | 'thermal';
  isSimulationActive: boolean;
  threatLevel: number;
  simulationYear: number;
  isRegistrationModalOpen: boolean;
}

const initialState: TacticalState = {
  selectedEntityId: null,
  tacticalViewMode: 'orbital',
  isSimulationActive: false,
  threatLevel: 0,
  simulationYear: new Date().getFullYear(),
  isRegistrationModalOpen: false,
};

const tacticalSlice = createSlice({
  name: 'tactical',
  initialState,
  reducers: {
    setSelectedEntity: (state, action: PayloadAction<string | number | null>) => {
      state.selectedEntityId = action.payload;
    },
    setTacticalViewMode: (state, action: PayloadAction<TacticalState['tacticalViewMode']>) => {
      state.tacticalViewMode = action.payload;
    },
    setSimulationActive: (state, action: PayloadAction<boolean>) => {
      state.isSimulationActive = action.payload;
    },
    updateThreatLevel: (state, action: PayloadAction<number>) => {
      state.threatLevel = action.payload;
    },
    setSimulationYear: (state, action: PayloadAction<number>) => {
      state.simulationYear = action.payload;
    },
    setRegistrationModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isRegistrationModalOpen = action.payload;
    },
  },
});

export const { 
  setSelectedEntity, 
  setTacticalViewMode, 
  setSimulationActive, 
  updateThreatLevel, 
  setSimulationYear,
  setRegistrationModalOpen
} = tacticalSlice.actions;

export default tacticalSlice.reducer;
