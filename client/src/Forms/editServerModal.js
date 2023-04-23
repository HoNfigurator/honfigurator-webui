// EditServerModal.js
import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { axiosInstanceUI } from '../Security/axiosRequestFormat';

function EditServerModal({ visible, setVisible, server, onServerUpdated }) {
    const [form] = Form.useForm();

    const handleOk = () => {
        form
            .validateFields()
            .then(async (values) => {

                // Perform the API call to update the server
                const updatedServer = { ...server, ...values };
                const oldPayload = {
                    name: server.label,
                    address: server.value
                }
                const newPayload = {
                    name: values.label,
                    address: values.value
                }
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
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    const handleCancel = () => {
        setVisible(false);
    };

    useEffect(() => {
        if (visible) {
            form.setFieldsValue(server);
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
                <Form.Item
                    label="Address"
                    name="value"
                    rules={[{ required: true, message: 'Please input the server address!' }]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}

export default EditServerModal;
