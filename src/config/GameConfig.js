// src/config/GameConfig.js
export const CONFIG = {
    PLAY_AREA: { X_MIN: -12, X_MAX: 12, Y_MIN: -6, Y_MAX: 6 },
    PLAYER_SPEED: 12,
    PLAYER_FIRE_RATE: 0.15,
    PLAYER_PROJECTILE_SPEED: 40,
    PLAYER_INVINCIBLE_TIME: 1.5,
    START_HEALTH: 3,
    ASTEROID_SPEED: 25,
    ASTEROID_SPAWN_RATE: 0.4,
    ENEMY_SPAWN_RATE: 1.2,
    BOSS_DISTANCE: 5000,
    STARBIT_MAGNET_RANGE: 4,
    POWERUP_DURATION: 10,
    DIFFICULTY_SCALE: 0.0005,  // per meter
};

export const POWERUP_TYPES = {
    SPREAD: { icon: '🔱', color: 0x00ffff },
    LASER: { icon: '⚡', color: 0xff00ff },
    SPEED: { icon: '💨', color: 0xffff00 },
    SHIELD: { icon: '🛡️', color: 0x00ff00 },
    MAGNET: { icon: '🧲', color: 0xff8800 },
};

export const UPGRADES = {
    hull: { name: 'Reinforced Hull', description: '+1 starting HP', baseCost: 300, maxLevel: 3, effect: level => level },
    magnet: { name: 'Magnet Range', description: '+30% pickup range', baseCost: 200, maxLevel: 4, effect: level => 1 + level * 0.3 },
    engine: { name: 'Overcharge Engine', description: '+10% speed', baseCost: 250, maxLevel: 3, effect: level => 1 + level * 0.1 },
    shield: { name: 'Emergency Shield', description: 'Start with shield', baseCost: 400, maxLevel: 1, effect: level => level > 0 },
    lucky: { name: 'Lucky Charm', description: '+25% StarBits', baseCost: 350, maxLevel: 2, effect: level => 1 + level * 0.25 },
};
