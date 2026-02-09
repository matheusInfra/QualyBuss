export const getGeolocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalização não suportada pelo navegador.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                let errorMsg = 'Erro ao obter localização.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Permissão de localização negada.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Informações de localização indisponíveis.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Tempo limite esgotado ao buscar localização.';
                        break;
                }
                reject(new Error(errorMsg));
            }
        );
    });
};
