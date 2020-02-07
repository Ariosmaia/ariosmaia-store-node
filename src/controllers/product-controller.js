'use strict';

const ValidationContract = require('../validators/fluent-validator');
const repository = require('../repositories/product-repository');
const guid = require('guid');
const config = require('../config');
const azure = require('azure-storage');

exports.get = async(req, res, next) => {
	try {
		var data = await repository.get()
		res.status(200).send(data);	
	} catch (error) {
		res.status(500).send({
			message: 'Falha ao processar sua requisição'
		});
	}
}

exports.getBySlug = async(req, res, next) => {

	try {
		var data = await repository.getBySlug(req.params.slug)
		res.status(200).send(data);
	} catch (error) {
		res.status(400).send(error);

	}
}

exports.getById = async(req, res, next) => {

	try {
		var data = await repository.getById(req.params.id);
		res.status(200).send(data);
	} catch (error) {
		res.status(400).send(error);
	}
}

exports.getByTag = async(req, res, next) => {

	try {
		var data = await repository.getByTag(req.params.tag);
		res.status(200).send(data);
	} catch (error) {
		res.status(400).send(error);
	}
}

exports.post = async(req, res, next) => {
	const {title, slug, description, price, tags, image} = req.body;

	// Cria o Blob Service
	const blobSvc = azure.createBlobService(config.containerConnectionString);

	let filename = guid.raw().toString() + '.jpg';
	let rawdata = image;
	let matches = rawdata.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
	let type = matches[1];
	let buffer = new Buffer(matches[2], 'base64');

	// Salva a imagem
	await blobSvc.createBlockBlobFromText('product-images', filename, buffer, {
		contentType: type
	}, function(error, result, response) {
		if(error){
			filename = 'default-product.png'
		}
	});

	let contract = new ValidationContract();
	contract.hasMinLen(req.body.title,3, 'O título deve conter pelo menos 3 caracteres');
	contract.hasMinLen(req.body.slug,3, 'O título deve conter pelo menos 3 caracteres');
	contract.hasMinLen(req.body.description,3, 'O título deve conter pelo menos 3 caracteres');

	// Se os dados forem inválidos
	if(!contract.isValid()){
		res.status(400).send(contract.errors()).end();
		return;
	}

	try {
		await repository.create({
			title,
			slug,
			description,
			price,
			active: true,
			tags,
			image:'https://ariosmaiastore.blob.core.windows.net/product-images/' + filename
		});
		res.status(201).send({message: 'Produto cadastrado com sucesso!'});
	} catch (error) {
		res.status(400).send({message: 'Falha ao cadastrar o produto', data: error});
	}
}

exports.put = async(req, res, next) => {
	try {
		await repository.update(req.params.id, req.body)
		res.status(200).send({message: 'Produto atualizado com sucesso!'});

	} catch (error) {
		res.status(400).send({
			message: 'Falha ao atualizar produto',
			data: error});
	}
}

exports.delete = async(req, res, next) => {
	try {
		await repository.delete(req.body.id)
		res.status(200).send({message: 'Produto removido com sucesso!'});
	} catch (error) {
		res.status(400).send({
			message: 'Falha ao remover produto',
			data: e
		});

	}
}