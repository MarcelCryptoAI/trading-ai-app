import React, { useState } from 'react';
import { ReactComponent as Logo } from '../assets/logo_transparent.svg';
import {
  HomeIcon,
  TrendingUpIcon,
  CreditCardIcon,
  CubeIcon,
  LightningBoltIcon,
  ChartSquareBarIcon,
  TableIcon,
} from '@heroicons/react/outline';
import './Sidebar.css';

const menuItems = [
  { name: 'Dashboard', icon: HomeIcon },
  { name: 'Trades', icon: TrendingUpIcon },
  { name: 'Accounts', icon: CreditCardIcon },
  { name: 'Assets', icon: CubeIcon },
  { name: 'Signals Bots', icon: LightningBoltIcon },
  { name: 'Reports', icon: ChartSquareBarIcon },
  { name: 'Analytics', icon: TableIcon },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="toggle-btn" onClick={onToggle}>
        <span />
      </div>
      <div className="logo-container">
        <Logo className="logo" />
        {!collapsed && <h1 className="app-title">AI Crypto Analyser</h1>}
      </div>
      <nav className="menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="menu-item">
              <Icon className="menu-icon" />
              {!collapsed && <span className="menu-label">{item.name}</span>}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
