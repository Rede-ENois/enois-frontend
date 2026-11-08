/**
 * O que a pessoa concedeu (ou recusou) ao microfone e à câmera antes de a sala abrir.
 *
 * `unavailable` é o caso do aparelho não ter o dispositivo (ou outro app estar usando); `denied`
 * é o caso da pessoa (ou o navegador) ter recusado. Os dois viram aviso na tela, nunca uma sala
 * muda sem explicação.
 */
export type CallMediaOutcome = "granted" | "denied" | "unavailable" | "unsupported";
