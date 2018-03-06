// ==UserScript==
// @name         [Mountyhall] Le Baroufleur
// @namespace    Mountyhall
// @description  Assistant Baroufle
// @author       Dabihul
// @version      0.1.2
// @include      */mountyhall/MH_Play/Actions/Competences/Play_a_Competence43b*
// @grant        none
// ==/UserScript==


//---------------------------- Variables Globales ----------------------------//

var WHEREARTTHOU = window.location.pathname;
window.console.log("[Baroufleur] Script ON! sur : " + WHEREARTTHOU);

var
	objSonsDisponibles = {},
	nombreDePAs = 3;
	
var BDD_Sons = {
//	"Son": {
//		seuil: s'il y a un seuil (number),
//		multiple: si le seuil s'applique plusieurs fois (boolean),
//		effet: {
//			"carac": multiplicateur (number),
//		},
//		description: "description"
//	},
	"Bababoum"    : {
		effet: {
			"Att": 1
		},
		description: "Attaque +1 par seuil dépensé"
	},
	"Booong"      : {
		effet: {
			"Deg": 1,
			"Esq": -1
		},
		description: "Dégâts +1 | Esquive -1 par seuil dépensé"
	},
	"Gaaaw"       : {
		effet: {
			"Fatigue": 1
		},
		description: "Fatigue +1 par seuil dépensé"
	},
	"Huitsch"     : {
		effet: {
			"Deg": -1
		},
		description: "Dégâts -1 par seuil dépensé"
	},
	"Kliketiiik"  : {
		effet: {
			"Esq": -1,
			"Concentr.": -1
		},
		description: "Esquive -1 | Concentration -1 par seuil dépensé"
	},
	"Krouiiik"    : {
		effet: {
			"Concentr.": -2
		},
		description: "Concentration -2 par seuil dépensé"
	},
	"Kssksss"     : {
		effet: {
			"Esq": 1
		},
		description: "Esquive +1 par seuil dépensé"
	},
	"Praaaouuut"  : {
		effet: {
			"Reg": -1
		},
		description: "Régénération -1 par seuil dépensé"
	},
	"Sssrileur"   : {
		seuil: 6,
		effet: {
			"Désinvi.": 0.17
		},
		description: "Rend visible (seuil 6)"
	},
	"Tagadagada"  : {
		seuil: 2,
		multiple: true,
		effet: {
			"Durée": 0.5
		},
		description: "Durée +1 par 2 seuils dépensés"
	},
	"Tuutuuuut"   : {
		effet: {
			"Att": -1
		},
		description: "Attaque -1 par seuil dépensé"
	},
	"Whaaag"      : {
		seuil: 4,
		multiple: true,
		effet: {
			"Portée": 0.25
		},
		description: "Portée horizontale +1 par 4 seuils dépensés"
	},
	"Whoooom"     : {
		effet: {
			"Concentr.": 2
		},
		description: "Concentration +2 par seuil dépensé"
	},
	"Ytseukayndof": {
		seuil: 2,
		effet: {
			"BMM": 0.5
		},
		description: "Rend les bonus magiques (seuil 2)"
	},
	"Zbouing"     : {
		effet: {
			"Reg": 1
		},
		description: "Régénération +1 par seuil dépensé"
	}
}


//-------------------------- Utilitaires génériques --------------------------//

// Gestion des objets par Storage
// https://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage#answer-3146971
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

// Est dans prototype depuis ES5.1
//function trim(str) {
//	return str.replace(/(^\s*)|(\s*$)/g,'');
//}

function epure(texte) {
	return texte.
		replace(/[àâä]/g, 'a').
		replace(/Â/g, 'A').
		replace(/ç/g, 'c').
		replace(/[éêèë]/g, 'e').
		replace(/[ïî]/g, 'i').
		replace(/[ôöõ]/g, 'o').
		replace(/[ùûü]/g, 'u');
}

function relatif(num) {
// Force l'affichage du signe d'un relatif
	num = Number(num);
	return (isNaN(num) || num<0) ? String(num) : "+"+num;
}

//------------------------------ Gestion du DOM ------------------------------//

function insertBefore(next, el) {
	next.parentNode.insertBefore(el, next);
}

function appendText(paren, text, bold) {
	if (bold) {
		var b = document.createElement('b');
		b.appendChild(document.createTextNode(text));
		paren.appendChild(b);
	} else {
		paren.appendChild(document.createTextNode(text));
	}
}


//-------------------------- Extraction de données ---------------------------//

function getSonsDisponibles() {
// Extrait la liste des sons disponibles pour Baroufler
	try {
		var selectPremierSon = document.getElementsByName("ai_N1")[0];
	} catch(e) {
		window.console.error(
			"[Baroufleur] Liste de sons non trouvée - Abandon"
		);
		return false;
	}
	var i, option, texte;
	
	for(i=0 ; i<selectPremierSon.options.length ; i++) {
		option = selectPremierSon.options[i];
		if(option.value) {
			texte = option.textContent.trim();
			if(texte.indexOf("-")!=-1) {
				texte = texte.replace(/-/,"").trim();
			}
			objSonsDisponibles[texte] = option.value;
		}
	}
	
	return true;
}

function getNombreDePAs() {
// Récupère le nombre de PAs du Baroufle en testant le nombre de selects
// Doit y avoir moyen de le récupérer direct dans la page?
	var
		selects,
		i=3;
		
	do {
		i++;
		selects = document.getElementsByName("ai_N"+i);
	} while(selects[0]);
	
	nombreDePAs = i-1;
}


//------------------------ Enrichissement des listes -------------------------//

function enrichirListesSons() {
	var
		i=1, j, option, son, texte, carac,
		selects = document.getElementsByName("ai_N1");
	
	while(selects[0]) {
		for(j=0 ; j<selects[0].options.length ; j++) {
			option = selects[0].options[j];
			son = option.textContent;
			if(son.indexOf("-")!=-1) {
				son = son.replace(/-/,"");
			}
			son = son.trim();
			
			if(!BDD_Sons[son]) {
				window.console.warn(
					"[mmassistant] Le son "+son+" est inconnu"
				);
				continue;
			}
			
			// Ajouter les données de BDD_Sons
			texte = " (";
			for(effet in BDD_Sons[son].effet) {
				if(BDD_Sons[son].seuil) {
					if(BDD_Sons[son].multiple) {
						texte += effet+" +?";
					} else {
						texte += effet;
					}
				} else {
					if(texte.length>2) {
						texte += " | ";
					}
					texte += effet+" "+relatif(BDD_Sons[son].effet[effet]*i);
				}
			}
			texte += ")";
			appendText(option, texte);
		}
		i++;
		selects = document.getElementsByName("ai_N"+i);
	}
}

//-------------------------------- Code actif --------------------------------//

getSonsDisponibles();
getNombreDePAs();
window.console.debug(objSonsDisponibles);
window.console.debug(nombreDePAs);

enrichirListesSons();

window.console.log("[Baroufleur] Script OFF sur : " + WHEREARTTHOU);

