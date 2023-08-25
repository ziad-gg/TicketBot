interface DashboardContext {
    page: string;
    username: string;
    serverName: string;
    serverImage: String | any;
    botImage: string;
    userImage: String;
    statics: {
        tickets: {
            total: number,
            new: number,
            closed: number,
        },
        server: {
            owner: {
                id: string | number,
                username: string,
            },
            panals?: Panal[]
        }
    }
};