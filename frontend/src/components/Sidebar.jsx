// frontend/src/components/Sidebar.jsx
import React from 'react'
import { Disclosure } from '@headlessui/react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  HomeIcon,
  ChartBarIcon,
  BriefcaseIcon,
  CogIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

const menu = [
  {
    section: 'Hallo Marcel',
    items: [
      { name: 'Dashboard', icon: HomeIcon, href: '/' },
      {
        name: 'Trades', icon: ChartBarIcon, children: [
          { name: 'Open Trades', href: '/trades/open' },
          { name: 'Closed Trades', href: '/trades/closed' },
        ]
      },
    ]
  },
  {
    section: 'My Portfolio',
    items: [
      { name: 'Broker Accounts', icon: BriefcaseIcon, href: '/portfolio/brokers' },
      { name: 'Assets',           icon: CurrencyDollarIcon, href: '/portfolio/assets' },
    ]
  },
  {
    section: 'Trading',
    items: [
      { name: 'The AI Analyzer',       icon: ChartBarIcon, href: '/ai-analyzer' },
      { name: 'Signal Bots',           icon: UsersIcon,     href: '/bots/signals' },
      { name: 'DCA Bots',              icon: UsersIcon,     href: '/bots/dca' },
      { name: 'Grid Bots',             icon: UsersIcon,     href: '/bots/grid' },
      { name: 'Tradingview Bots',      icon: UsersIcon,     href: '/bots/tv' },
      { name: 'Live Trading Terminal', icon: ChartBarIcon,  href: '/terminal' },
      { name: 'Copy Trade',            icon: UsersIcon,     href: '/copy-trade' },
    ]
  },
  {
    section: 'Community',
    items: [
      { name: 'Forum',               icon: UsersIcon, href: '/forum' },
      { name: 'Signal Subscriptions',icon: UsersIcon, href: '/subscriptions' },
      { name: 'Watchlists',          icon: UsersIcon, href: '/watchlists' },
    ]
  },
  {
    section: 'My Account',
    items: [
      { name: 'Upgrade',  icon: CurrencyDollarIcon, href: '/account/upgrade' },
      { name: 'Billing',  icon: CurrencyDollarIcon, href: '/account/billing' },
      { name: 'Settings', icon: CogIcon,            href: '/account/settings' },
    ]
  },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-gray-200 flex-shrink-0">
      <nav className="h-full overflow-y-auto py-6">
        {menu.map((section, idx) => (
          <div key={idx} className="mb-6 px-4">
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
              {section.section}
            </h3>
            {section.items.map((item, i) =>
              item.children ? (
                <Disclosure key={i}>
                  {({ open }) => (d
                    <>
                      <Disclosure.Button
                        className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </div>
                        {
