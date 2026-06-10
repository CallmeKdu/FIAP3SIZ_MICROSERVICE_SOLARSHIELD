import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSeverity } from '../src/ingestor-service/src/domain/rn1_severity.js';

// Testes unitários para a RN1 - Cálculo de Severidade da Tempestade Geomagnética

describe('calculateSeverity', () => {

  it('deve retornar severity "low" quando Kp < 5', () => {
    const event = { allKpIndex: [{ kpIndex: 3 }] };
    const result = calculateSeverity(event);
    assert.equal(result.severity_level, 'low');
    assert.equal(result.emergency_notification, false);
    assert.equal(result.kp_index, 3);
  });

  it('deve retornar severity "moderate" quando Kp está entre 5 e 7', () => {
    const event = { allKpIndex: [{ kpIndex: 6 }] };
    const result = calculateSeverity(event);
    assert.equal(result.severity_level, 'moderate');
    assert.equal(result.emergency_notification, false);
  });

  it('deve retornar severity "severe" e emergency_notification true quando Kp >= 8', () => {
    const event = { allKpIndex: [{ kpIndex: 9 }] };
    const result = calculateSeverity(event);
    assert.equal(result.severity_level, 'severe');
    assert.equal(result.emergency_notification, true);
  });

  it('deve usar o maior valor de Kp quando há múltiplos índices', () => {
    const event = { allKpIndex: [{ kpIndex: 4 }, { kpIndex: 9 }, { kpIndex: 6 }] };
    const result = calculateSeverity(event);
    assert.equal(result.kp_index, 9);
    assert.equal(result.severity_level, 'severe');
  });

  it('deve retornar severity "unknown" quando não há Kp disponível', () => {
    const event = {};
    const result = calculateSeverity(event);
    assert.equal(result.severity_level, 'unknown');
    assert.equal(result.emergency_notification, false);
    assert.equal(result.kp_index, null);
  });

  it('deve funcionar com kpIndex direto no evento (sem allKpIndex)', () => {
    const event = { kpIndex: 7 };
    const result = calculateSeverity(event);
    assert.equal(result.kp_index, 7);
    assert.equal(result.severity_level, 'moderate');
  });

  it('deve retornar "low" no limite inferior de Kp = 0', () => {
    const event = { allKpIndex: [{ kpIndex: 0 }] };
    const result = calculateSeverity(event);
    assert.equal(result.severity_level, 'low');
    assert.equal(result.emergency_notification, false);
  });

  it('deve retornar "severe" no limite exato de Kp = 8', () => {
    const event = { allKpIndex: [{ kpIndex: 8 }] };
    const result = calculateSeverity(event);
    assert.equal(result.severity_level, 'severe');
    assert.equal(result.emergency_notification, true);
  });
});
