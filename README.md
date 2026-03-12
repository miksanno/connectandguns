# 🎮 Connect 4 & Guns

A modern, high-stakes remix of the classic Connect Four game. Strategize, drop coins, and use your secret weapon to blast your way to victory!

## 🚀 Overview

**Connect 4 & Guns** takes the timeless strategy of Connect Four and adds a tactical, "destructible" twist. Every player has a one-time-use ability to change the board's gravity and break the opponent's strategy.

## 📜 Game Rules

### 1. The Goal

Connect **four** of your colored coins in a row—horizontally, vertically, or diagonally—before your opponent does.

- **Player 1**: 🔴 Red
- **Player 2**: 🟡 Yellow

### 2. Standard Turns

Players take turns dropping a single coin into one of the 7 columns. The coin will fall to the lowest empty slot in that column.

### 3. The "Gun" Mechanic (The Twist!)

Each player starts the game with **one-time-use gun**.

- **Usage**: On your turn, instead of dropping a coin, you can click the **"USE GUN"** button.
- **Action**: Select any coin currently on the board (yours or your opponent's) to destroy it.
- **Chain Collapse**: When a coin is destroyed, all coins above it in the same column **fall down** to fill the gap. This can:
  - Break an opponent's almost-finished line.
  - Shift your own coins into a winning position.
  - Completely reset the momentum of the game.
- **Winning Priority**: If a shot causes both players to have a "Connect 4" simultaneously, the player who fired the gun wins!

### 4. Game End

- **Victory**: The first player to get 4-in-a-row wins.
- **Draw**: If the board is full and no one has 4-in-a-row, the game is a draw.

## 🎮 Controls

- **Desktop**:
  - **Move**: Hover over columns to see a preview.
  - **Drop**: Click a column to drop a coin.
  - **Shoot**: Click "USE GUN", then click the target coin.
- **Mobile/Touch**:
  - **Drop**: Tap a column.
  - **Shoot**: Tap "USE GUN", then tap the target coin.

## ✨ Features

- **Dynamic Gravity**: Realistic "collapse" animations when coins are destroyed.
- **Visual Excellence**: Vibrant neon aesthetics, glassmorphism UI, and smooth micro-animations.
- **Immersive Audio**: Procedural sound effects for drops, hits, and victories using the Web Audio API.
- **Fully Responsive**: Plays perfectly on mobile (portrait/landscape) and desktop.
- **No Placeholders**: Pure CSS/JS implementation—no external image assets required.

## 🛠️ Technical Info

- **Core**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS3 (Gradients, Flexbox/Grid, Animations)
- **Audio**: Web Audio API for real-time sound synthesis.

---

_Created with ❤️ by Antigravity_
