import React, { useEffect, useState } from 'react';
import { avatarStyles } from './account-utils';

export default function UserAvatar({ src, style='blue', size=40 }) {
  const [broken,setBroken]=useState(false);
  useEffect(()=>setBroken(false),[src]);
  return <span className={`user-avatar avatar-${avatarStyles.includes(style)?style:'blue'}`} style={{width:size,height:size}} aria-hidden="true">
    {src && !broken ? <img src={src} alt="" referrerPolicy="no-referrer" onError={()=>setBroken(true)} /> : <svg width="58%" height="58%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>}
  </span>;
}
