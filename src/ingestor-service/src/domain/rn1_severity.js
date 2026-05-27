export const calculateSeverity = (donkiEvent) => {
  let kp = null;

  // Se Kp não vem diretamente, procurar no allKpIndex e pegar o maior
  if (donkiEvent.allKpIndex && Array.isArray(donkiEvent.allKpIndex) && donkiEvent.allKpIndex.length > 0) {
    kp = Math.max(...donkiEvent.allKpIndex.map(item => item.kpIndex));
  } else if (donkiEvent.kpIndex !== undefined) {
    kp = donkiEvent.kpIndex;
  }

  // Se não tem Kp, não é possível classificar
  if (kp === null || kp === undefined) {
    return {
      kpIndex: null,
      severityLevel: 'unknown',
      emergencyNotification: false
    };
  }

  let severityLevel = 'unknown';
  let emergencyNotification = false;

  if (kp < 5) {
    severityLevel = 'low';
    emergencyNotification = false;
  } else if (kp >= 5 && kp < 8) {
    severityLevel = 'moderate';
    emergencyNotification = false;
  } else if (kp >= 8) {
    severityLevel = 'severe';
    emergencyNotification = true;
  }

  return {
    kpIndex: kp,
    severityLevel,
    emergencyNotification
  };
};
