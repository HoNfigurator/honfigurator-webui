// EditServerModal.js
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, message, Row, Col } from 'antd';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';
import { performTCPCheck } from '../Helpers/healthChecks';
import { errorMessage, WarningMessageDenied, WarningMessageTCP } from './Messages';

function EditServerModal({ visible, setVisible, server, onServerUpdated }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleOk = () => {
        form
            .validateFields()
            .then(async (values) => {
                // Verify that the server is available
                setLoading(false);
                const tcpCheckStatusResponse = await performTCPCheck(values.serverAddress, values.serverPort);
                // console.log(tcpCheckStatusResponse);

                if (tcpCheckStatusResponse.status === 200) {
                    // Perform the API call to update the server
                    const updatedServer = { ...server, ...values };
                    const oldPayload = {
                        name: server.label,
                        address: server.value,
                        port: server.port
                    };
                    const newPayload = {
                        name: values.label,
                        address: values.serverAddress,
                        port: values.serverPort
                    };
                    try {
                        await axiosInstanceUI.put('/user/update_server',
                            {
                                old: oldPayload,
                                new: newPayload
                            });
                        onServerUpdated(newPayload);
                        message.success(`Server '${server.label}' updated successfully.`);
                    } catch (error) {
                        console.error('Error updating server:', error);
                        message.error(`Error updating server '${server.label}'.`);
                    }
                } else if (tcpCheckStatusResponse.status === 500) {
                    Modal.warning({
                        title: 'Warning',
                        content: <WarningMessageTCP port={values.serverPort || 5000} />,
                        okText: 'Okay',
                        onOk: () => { }
                    });
                } else if (tcpCheckStatusResponse.status === 401 || tcpCheckStatusResponse.status === 403) {
                    Modal.warning({
                        title: 'Warning',
                        content: <WarningMessageDenied />,
                        okText: 'Okay',
                        onOk: () => { }
                    });
                } else {
                    notification.error({
                        message: 'Error',
                        description: <>{errorMessage(tcpCheckStatusResponse)}</>,
                    });
                    form.resetFields();
                }
                setLoading(false);
            })
            .catch((info) => {
                message.error('Validate Failed:', info);
                setLoading(false);
            });
    };

    const handleCancel = () => {
        setVisible(false);
    };

    useEffect(() => {
        if (visible) {
            form.setFieldsValue({
                label: server.label,
                serverAddress: server.value,
                serverPort: server.port
            });
        }
    }, [visible, server, form]);

    return (
        <Modal
            title="Edit Server"
            visible={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            forceRender
        >
            <Form form={form} layout="vertical" initialValues={server}>
                <Form.Item
                    label="Name"
                    name="label"
                    rules={[{ required: true, message: 'Please input the server name!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item label="Address" required>
                    <Row gutter={8}>
                        <Col span={18}>
                            <Form.Item name="serverAddress" rules={[{ required: true, message: 'Please input the server address!' }]}>
                                <Input style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="serverPort" noStyle>
                                <Input
                                    addonBefore="Port"
                                    type="number"
                                    min={0}
                                    max={65535}
                                    defaultValue={5000}
                                    placeholder="Port (default: 5000)"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form.Item>
            </Form>
        </Modal >
    );
}

export default EditServerModal;
