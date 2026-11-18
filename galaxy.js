// Catalogue partagé entre la carte et la simulation.
export const worldSystems={
 oree:{name:'ORÉE',security:'secure',x:110,y:350},lisiere:{name:'LISIÈRE',security:'hostile',x:360,y:140},ganymede:{name:'GANYMÈDE',security:'secure',x:360,y:560},concorde:{name:'CONCORDE',security:'secure',x:650,y:350},
 sillage:{name:'SILLAGE',security:'hostile',x:580,y:140},helios:{name:'HÉLIOS',security:'hostile',x:760,y:140},nereide:{name:'NÉRÉIDE',security:'hostile',x:620,y:560},aube:{name:'AUBE',security:'hostile',x:980,y:140},
 meridian:{name:'MERIDIAN',security:'hostile',x:980,y:350},ceres:{name:'CÉRÈS',security:'anarchic',x:980,y:560},janus:{name:'JANUS',security:'anarchic',x:1260,y:350},pallas:{name:'PALLAS',security:'anarchic',x:1260,y:560},
 styx:{name:'STYX',security:'anarchic',x:800,y:455},temeraire:{name:'TÉMÉRAIRE',security:'anarchic',x:1550,y:140},erebe:{name:'ÉRÈBE',security:'anarchic',x:1550,y:560}
};
export const worldLinks=[['oree','lisiere'],['oree','ganymede'],['oree','concorde'],['lisiere','sillage'],['lisiere','helios'],['ganymede','concorde'],['ganymede','nereide'],['concorde','helios'],['concorde','meridian'],['helios','aube'],['sillage','aube'],['sillage','ceres'],['aube','meridian'],['meridian','ceres'],['meridian','janus'],['ceres','nereide'],['ceres','pallas'],['nereide','styx'],['janus','pallas'],['janus','temeraire'],['pallas','erebe']];
