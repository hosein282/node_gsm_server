
const db = require('../repository/database');

const createDevice = async (req, res) => {
    const { user_id, mac, label, model, password } = req.body; // Destructure the body
    console.log(req.body);
    let outputs, inputs = "";
    if (model.toLowerCase() == 'g84-t') {
        outputs = '00000000';
        inputs = '0000';
    } else if (model.toLowerCase() == 'g44-t') {
        outputs = '0000';
        inputs = '0000';
    }else{
        return res.status(400).json({ 'error': "مدل دستگاه اشتباه است" });

    }
    if (!user_id || !mac) {
        return res.status(400).json({ 'error': 'اطلاعات ارسالی ناقص است' });
    }
    try {

        const parameters = {'outStates' :outputs,'inStates' : inputs, 'password': "1234"};

        if (user_id !== null) {
            parameters.user_id = user_id;
        }
        if (mac !== null) {
            parameters.mac = mac;
        }
        if (label !== null) {
            parameters.label = label;
        }
        if (model !== null) {
            parameters.model = model;
        }

        console.log(`parameters =>${JSON.stringify(parameters)}`);

        const result = await db.create('devices', JSON.parse(JSON.stringify(parameters)));
        if (result.affectedRows == 1 && result.serverStatus == 2) {
            return res.status(200).json({ 'success': true });

        } else {
            return res.status(500).json({ 'error': 'اطلاعات ارسالی ناقص است' });

        }


    } catch (err) {
        if (err.errno === 1062) {
            return res.status(400).json({ 'error': "این دستگاه قبلا ثبت شده است" });
        }
        console.log('carchhh');
        console.log(`err =>${err}`);
        return res.status(400).json({ 'error': err });

    }

}


const getDevices = async (req, res) => {
    const { user_id } = req.query;
    console.log(user_id);
    try {
        const devices = await db.read('devices', [], { 'user_id': user_id });
        if (devices) {
            return res.status(200).json({ devices });
        }
    } catch (err) {
        return res.status(500);
    }


}

module.exports = {
    createDevice,
    getDevices

};