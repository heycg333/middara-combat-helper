/*
 * Middara Combat Helper - testable combat math core.
 * This file is intentionally UI-free so it can be exercised from Node or a browser.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MiddaraCombatCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function poolFromFace(face) {
    return {
      book: number(face && face.book),
      shield: number(face && face.shield),
      burst: number(face && face.burst),
      skull: number(face && face.skull)
    };
  }

  function addPool(target, source) {
    target.book += number(source.book);
    target.shield += number(source.shield);
    target.burst += number(source.burst);
    target.skull += number(source.skull);
    return target;
  }

  function faceLabel(face, index = 0) {
    if (!face) return 'Face ' + (index + 1);
    if (face.skull) return face.label || 'Skull';
    const bits = [String(number(face.value))];
    if (face.book) bits.push(face.book + ' Book');
    if (face.shield) bits.push(face.shield + ' Shield');
    if (face.burst) bits.push(face.burst + ' Burst');
    return face.label || bits.join(' + ');
  }

  function rollDice(diceData, dice, faces) {
    const pool = { book: 0, shield: 0, burst: 0, skull: 0 };
    const rows = [];
    let total = 0;
    (dice || []).forEach((color, index) => {
      const faceIndex = number(faces && faces['d' + index], 0);
      const face = (diceData[color] && diceData[color][faceIndex]) || (diceData[color] && diceData[color][0]) || { value: 0 };
      total += number(face.value);
      addPool(pool, poolFromFace(face));
      rows.push({ color, index, value: number(face.value), label: faceLabel(face, index), symbols: poolFromFace(face) });
    });
    return { total, pool, rows };
  }

  function symbolCost(ability) {
    return number(ability.book) + number(ability.shield) + number(ability.burst);
  }

  function maxAffordable(pool, ability) {
    const limits = [];
    if (ability.book) limits.push(Math.floor(number(pool.book) / ability.book));
    if (ability.shield) limits.push(Math.floor(number(pool.shield) / ability.shield));
    if (ability.burst) limits.push(Math.floor(number(pool.burst) / ability.burst));
    return limits.length ? Math.min.apply(null, limits) : 0;
  }

  function payTimes(pool, ability, times) {
    return {
      book: number(pool.book) - number(ability.book) * times,
      shield: number(pool.shield) - number(ability.shield) * times,
      burst: number(pool.burst) - number(ability.burst) * times,
      skull: number(pool.skull)
    };
  }

  function optimizeSymbolSpend(input) {
    const profile = input.profile || {};
    const pool = Object.assign({ book: 0, shield: 0, burst: 0, skull: 0 }, input.pool || {});
    const diffHit = number(input.diffHit);
    const targetArmor = number(input.targetArmor);
    const armorPiercing = Math.max(0, number(input.armorPiercing));
    const manualPhysical = number(input.manualPhysical);
    const manualMagic = number(input.manualMagic);
    const symbolDamageBonus = number(profile.symbolDamageBonus);
    const abilities = (profile.abilities || [])
      .concat(profile.otherworldlyAttack ? [{ name: 'Otherworldly upgrade', book: 2, magic: 2 }] : [])
      .filter(ability => symbolCost(ability) > 0)
      .map(ability => {
        const next = Object.assign({}, ability);
        if (symbolDamageBonus && (number(next.physical) > 0 || number(next.magic) > 0)) {
          if (number(next.physical) > 0) next.physical = number(next.physical) + symbolDamageBonus;
          if (number(next.magic) > 0) next.magic = number(next.magic) + symbolDamageBonus;
          next.name = next.name + ' +MotV';
        }
        return next;
      });
    let best = null;

    function score(chosen, remaining) {
      const physicalSymbols = chosen.reduce((sum, ability) => sum + number(ability.physical), 0);
      const magicSymbols = chosen.reduce((sum, ability) => sum + number(ability.magic), 0);
      const conditionalPhysical = (profile.conditionalPhysical || []).reduce((sum, row) => {
        return sum + (diffHit > number(row.minDifferenceExclusive, 999) ? number(row.physical) : 0);
      }, 0);
      const rawPhysical = diffHit + number(profile.passivePhysical) + conditionalPhysical + physicalSymbols + manualPhysical;
      const effectiveArmor = Math.max(0, targetArmor - armorPiercing);
      const physical = Math.max(0, rawPhysical - effectiveArmor);
      const magic = Math.max(0, number(profile.passiveMagic) + magicSymbols + manualMagic);
      const finalDamage = Math.max(0, physical + magic);
      const spentSymbols = chosen.reduce((sum, ability) => sum + symbolCost(ability), 0);
      return { finalDamage, physical, magic, rawPhysical, effectiveArmor, physicalSymbols, magicSymbols, conditionalPhysical, spentSymbols, chosenCount: chosen.length, chosen: chosen.slice(), remaining };
    }

    function better(candidate, incumbent) {
      if (!incumbent) return true;
      if (candidate.finalDamage !== incumbent.finalDamage) return candidate.finalDamage > incumbent.finalDamage;
      if ((candidate.physical + candidate.magic) !== (incumbent.physical + incumbent.magic)) return (candidate.physical + candidate.magic) > (incumbent.physical + incumbent.magic);
      if (candidate.spentSymbols !== incumbent.spentSymbols) return candidate.spentSymbols > incumbent.spentSymbols;
      return candidate.chosenCount > incumbent.chosenCount;
    }

    function walk(index, remaining, chosen) {
      if (index >= abilities.length) {
        const candidate = score(chosen, remaining);
        if (better(candidate, best)) best = candidate;
        return;
      }
      const ability = abilities[index];
      const max = maxAffordable(remaining, ability);
      for (let count = 0; count <= max; count += 1) {
        const nextRemaining = payTimes(remaining, ability, count);
        const expanded = count ? chosen.concat(Array.from({ length: count }, () => ability)) : chosen;
        walk(index + 1, nextRemaining, expanded);
      }
    }

    walk(0, Object.assign({}, pool), []);
    if (best) return best;
    return score([], pool);
  }

  function calculateAttack(input) {
    const diceData = input.diceData || {};
    const profile = input.profile || {};
    const actorState = input.actorState || {};
    const targetDef = input.targetDef || {};
    const targetState = input.targetState || {};
    const options = input.options || {};
    const dice = profile.dice || [];
    const rolled = rollDice(diceData, dice, input.faces || {});
    const pool = Object.assign({}, rolled.pool);
    const diceRows = rolled.rows.slice();

    if (options.empower && !dice.includes('Black')) {
      const blackFace = (diceData.Black && diceData.Black[number(options.empowerFace)]) || (diceData.Black && diceData.Black[0]) || { value: 0 };
      addPool(pool, poolFromFace(blackFace));
      diceRows.push({ color: 'Black (Empower)', index: 0, value: 0, label: faceLabel(blackFace, 0), symbols: poolFromFace(blackFace) });
    }
    if ((actorState.effects || []).includes('Courage') && options.useCourage !== false) {
      pool.book += 1;
      pool.shield += 1;
    }
    if (options.useMasterOfVessel) pool.burst += 1;

    const darknessPenalty = (actorState.effects || []).includes('Darkness') ? -1 : 0;
    const attackTotal = rolled.total + number(options.manualAttackMod) + darknessPenalty + (options.useMasterWork ? 1 : 0);
    const targetDefense = number(targetDef.defense) + number(options.targetDefenseMod);
    const hit = attackTotal >= targetDefense;
    const diffHit = hit ? Math.max(0, attackTotal - targetDefense) : 0;
    const armorPiercing = Math.max(0, number(profile.ap) + number(options.manualArmorPiercing));
    const barrierArmor = (targetState.effects || []).includes('Barrier') ? 1 : 0;
    const targetArmor = number(targetDef.armor) + barrierArmor;
    const optProfile = options.useMasterOfVessel ? Object.assign({}, profile, { symbolDamageBonus: number(profile.symbolDamageBonus) + 1 }) : profile;
    const spend = hit ? optimizeSymbolSpend({
      profile: optProfile,
      pool,
      diffHit,
      targetArmor,
      armorPiercing,
      manualPhysical: options.manualPhysical,
      manualMagic: options.manualMagic
    }) : { finalDamage: 0, physical: 0, magic: 0, chosen: [], remaining: pool };
    const finalDamage = hit ? spend.finalDamage : 0;
    const hpAfter = Math.max(0, number(targetDef.hp) - number(targetState.damage) - finalDamage);
    return { hit, attackRoll: rolled.total, attackTotal, targetDefense, diffHit, pool, diceRows, armorPiercing, targetArmor, barrierArmor, spend, finalDamage, hpAfter, darknessPenalty };
  }

  function dodgeDefenseFromBlackFace(face) {
    if (!face || face.skull) return 0;
    return number(face.shield);
  }

  function calculateEnemyAttack(input) {
    const targetDef = input.targetDef || {};
    const targetState = input.targetState || {};
    const options = input.options || {};
    const profile = input.profile || {};
    const dodgeFace = options.useDodge ? (((input.diceData || {}).Black || [])[number(options.dodgeFace)] || ((input.diceData || {}).Black || [])[0]) : null;
    const targetHasDarkness = (targetState.effects || []).includes('Darkness');
    const dodgeDefense = options.useDodge && !targetHasDarkness ? dodgeDefenseFromBlackFace(dodgeFace) : 0;
    const flankingDefense = options.flankingDefense ? 1 : 0;
    const attack = calculateAttack(Object.assign({}, input, {
      actorState: input.actorState || {},
      targetDef: Object.assign({}, targetDef, { defense: number(targetDef.defense) + dodgeDefense + flankingDefense }),
      targetState,
      options: Object.assign({}, options, { targetDefenseMod: number(options.targetDefenseMod), useCourage: false, useMasterWork: false, useMasterOfVessel: false })
    }));
    const forcedMiss = !!options.forceMiss;
    const hit = !forcedMiss && attack.hit;
    if (!hit) return Object.assign({}, attack, { hit: false, forcedMiss, finalDamage: 0, hpAfter: number(targetDef.hp) - number(targetState.damage), dodgeDefense, reductions: [] });

    let rawPhysical = number(attack.spend.rawPhysical);
    const physicalBeforeDefense = rawPhysical;
    const reductions = [];
    const melee = /melee/i.test(profile.range || '') || !/range/i.test(profile.range || '');
    const targetId = input.targetId || '';
    if (targetId === 'rook' && options.rookPlate) { rawPhysical -= 4; reductions.push('Rook Plate -4 Physical'); }
    if (targetId === 'remi') {
      if (options.remiShearling && melee) { rawPhysical -= 2; reductions.push('Reinforced Shearling -2 Physical'); }
      if (options.remiShearlingPE) { rawPhysical -= number(targetState.damage); reductions.push('Shearling Per Encounter'); }
    }
    if (targetId === 'nightingale') {
      if (options.nightMorbid && melee) { rawPhysical -= 2; reductions.push('Morbid Leather -2 Physical'); }
      if (options.nightReinforced && melee) { rawPhysical -= 2; reductions.push('Reinforced Morbid Leather -2 Physical'); }
    }
    if (targetId === 'zeke') {
      if (options.zekeMorbid && melee) { rawPhysical -= 2; reductions.push('Morbid Leather -2 Physical'); }
      if (options.zekeBelts && options.useDodge) { rawPhysical -= 2; reductions.push('Too Many Belts -2 Physical'); }
    }
    rawPhysical = Math.max(0, rawPhysical);
    const effectiveArmor = Math.max(0, attack.targetArmor - attack.armorPiercing);
    const physical = Math.max(0, rawPhysical - effectiveArmor);
    const magic = number(attack.spend.magic);
    let finalDamage = Math.max(0, physical + magic - number(options.finalReduction));
    if (options.summonReduction && finalDamage > 0) { finalDamage = Math.max(0, finalDamage - 2); reductions.push('Summon token -2 damage'); }
    const hpAfter = Math.max(0, number(targetDef.hp) - number(targetState.damage) - finalDamage);
    return Object.assign({}, attack, { hit, forcedMiss, dodgeDefense, targetHasDarkness, physicalBeforeDefense, rawPhysical, effectiveArmor, physical, magic, finalDamage, hpAfter, reductions });
  }

  function calculateForceCheck(input) {
    const diceData = input.diceData || {};
    const profile = input.profile || {};
    const targetDef = input.targetDef || {};
    const options = input.options || {};
    const noCasting = !!profile.noCasting;
    const castingColor = noCasting ? '' : (options.castingColor || profile.defaultColor || (profile.castingColors && profile.castingColors[0]) || 'Purple');
    const castFace = noCasting ? { value: 0 } : ((diceData[castingColor] && diceData[castingColor][number(options.castingFace)]) || (diceData[castingColor] && diceData[castingColor][0]) || { value: 0 });
    const pool = poolFromFace(castFace);
    const baseForce = number(profile.baseForce, 6);
    let force = baseForce + (noCasting ? 0 : number(castFace.value)) + number(options.manualForceMod);
    let blackForce = 0;
    if (!noCasting && options.empower) {
      const blackFace = (diceData.Black && diceData.Black[number(options.empowerFace)]) || (diceData.Black && diceData.Black[0]) || { value: 0 };
      addPool(pool, poolFromFace(blackFace));
      blackForce = blackFace.skull ? 0 : number(blackFace.book);
      force += blackForce;
    }
    if (!noCasting && options.useOtherworldly) {
      const remainingBooks = Math.max(0, pool.book - blackForce);
      force += Math.min(remainingBooks, pool.shield);
    }
    if (options.useOptionalBonus && profile.optionalForceBonus) force += number(profile.optionalForceBonus);

    const colors = targetDef.conviction || ['Purple', 'Purple'];
    const face0 = (diceData[colors[0]] && diceData[colors[0]][number(options.convictionFaces && options.convictionFaces.c0)]) || (diceData[colors[0]] && diceData[colors[0]][0]) || { value: 0 };
    const color1 = colors[1] || colors[0];
    const face1 = (diceData[color1] && diceData[color1][number(options.convictionFaces && options.convictionFaces.c1)]) || (diceData[color1] && diceData[color1][0]) || { value: 0 };
    const conviction = number(face0.value) + number(face1.value) + number(options.manualConvictionMod);
    const failed = options.forcePass ? false : force > conviction;
    const difference = Math.max(0, force - conviction);
    return { force, conviction, failed, difference, pool };
  }

  function resolveEffect(effect, targetDef) {
    const immunities = (targetDef && targetDef.immunities) || [];
    return { effect: effect || '', applied: !!effect && !immunities.includes(effect), immune: !!effect && immunities.includes(effect) };
  }

  function applyDamageOnce(targetState, targetDef, result, appliedKey) {
    if (!result || !result.key || appliedKey === result.key) return { applied: false, appliedKey, damage: number(targetState && targetState.damage) };
    const nextDamage = Math.max(0, Math.min(number(targetDef && targetDef.hp, 999), number(targetState && targetState.damage) + number(result.finalDamage)));
    return { applied: true, appliedKey: result.key, damage: nextDamage, defeated: nextDamage >= number(targetDef && targetDef.hp, 999) };
  }

  return {
    number,
    faceLabel,
    rollDice,
    optimizeSymbolSpend,
    calculateAttack,
    calculateEnemyAttack,
    calculateForceCheck,
    resolveEffect,
    applyDamageOnce,
    dodgeDefenseFromBlackFace
  };
});
